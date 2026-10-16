package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.exception.ConflictException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Short transactions only. PDF extraction, disk writes and OCR run outside this repository. */
@Repository
@RequiredArgsConstructor
public class PdfExamImportRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public record Job(
            UUID id,
            long ownerId,
            UUID requestId,
            String sourceHash,
            long sourceSize,
            int examNumber,
            String status,
            String stage,
            UUID draftToken,
            String result,
            String errorCode,
            String errorMessage,
            UUID leaseToken,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime expiresAt,
            String savedResponse) {
        public Job(UUID id, long ownerId, UUID requestId, String sourceHash, long sourceSize,
                int examNumber, String status, String stage, UUID draftToken, String result,
                String errorCode, String errorMessage, UUID leaseToken,
                LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime expiresAt) {
            this(id, ownerId, requestId, sourceHash, sourceSize, examNumber, status, stage, draftToken,
                    result, errorCode, errorMessage, leaseToken, createdAt, updatedAt, expiresAt, null);
        }
    }

    @Transactional
    public Job reserve(
            UUID id, long ownerId, UUID requestId, String hash,
            long size, int examNumber, LocalDateTime now) {
        // Serialize admission, including quotas and same-key races across BE instances.
        jdbc.getJdbcTemplate().execute("select pg_advisory_xact_lock(640015)");
        var previous = jdbc.query("""
                select * from exam_import_jobs where owner_id=:owner and request_id=:request
                """, Map.of("owner", ownerId, "request", requestId), this::map).stream().findFirst();
        if (previous.isPresent()) {
            var job = previous.get();
            if (!job.sourceHash().equals(hash) || job.examNumber() != examNumber) {
                throw new ConflictException("requestId đã được dùng cho file hoặc số đề khác");
            }
            return job;
        }

        var counts = jdbc.queryForMap("""
                select count(*) total,
                    count(*) filter (where owner_id=:owner) owned,
                    count(*) filter (where status in ('QUEUED','PROCESSING')) pending,
                    count(*) filter (where owner_id=:owner and status in ('QUEUED','PROCESSING')) owned_pending
                from exam_import_jobs
                where expires_at>:now and status<>'EXPIRED'
                """, Map.of("owner", ownerId, "now", now));
        if (((Number) counts.get("total")).longValue() >= 50
                || ((Number) counts.get("owned")).longValue() >= 5
                || ((Number) counts.get("pending")).longValue() >= 20
                || ((Number) counts.get("owned_pending")).longValue() >= 2) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Đạt giới hạn job import; vui lòng chờ job hoàn tất hoặc preview hết hạn");
        }

        jdbc.update("""
                insert into exam_import_jobs
                    (id,owner_id,request_id,source_hash,source_size,selected_exam_number,
                     status,stage,draft_token,created_at,updated_at,expires_at)
                values (:id,:owner,:request,:hash,:size,:exam,'QUEUED','WAITING',
                        :draft,:now,:now,:expiry)
                """, Map.of("id", id, "owner", ownerId, "request", requestId,
                        "hash", hash, "size", size, "exam", examNumber,
                        "draft", UUID.randomUUID(), "now", now, "expiry", now.plusHours(24)));
        return find(id).orElseThrow();
    }

    public Optional<Job> owned(UUID id, long ownerId) {
        return jdbc.query("select * from exam_import_jobs where id=:id and owner_id=:owner",
                Map.of("id", id, "owner", ownerId), this::map).stream().findFirst();
    }

    /** Image requests must not reload the complete (up to 4 MiB) preview JSON. */
    public Optional<Job> ownedForAsset(UUID id, long ownerId) {
        return jdbc.query("""
                select id,owner_id,request_id,source_hash,source_size,selected_exam_number,
                    status,stage,draft_token,null::text result_payload,error_code,error_message,
                    lease_token,created_at,updated_at,expires_at,null::text saved_response
                from exam_import_jobs where id=:id and owner_id=:owner
                """, Map.of("id", id, "owner", ownerId), this::map).stream().findFirst();
    }

    private Optional<Job> find(UUID id) {
        return jdbc.query("select * from exam_import_jobs where id=:id",
                Map.of("id", id), this::map).stream().findFirst();
    }

    public Optional<Job> claim(LocalDateTime now) {
        return jdbc.query("""
                with next_job as (
                    select id from exam_import_jobs
                    where status='QUEUED' and expires_at>:now
                    order by created_at,id limit 1 for update skip locked
                )
                update exam_import_jobs j set status='PROCESSING',stage='INDEXING',
                    lease_token=:token,lease_until=:lease,updated_at=:now
                from next_job n where j.id=n.id returning j.*
                """, Map.of("now", now, "token", UUID.randomUUID(), "lease", now.plusMinutes(30)),
                this::map).stream().findFirst();
    }

    public boolean progress(Job job, String stage, LocalDateTime now) {
        return jdbc.update("""
                update exam_import_jobs set stage=:stage,updated_at=:now
                where id=:id and lease_token=:token and status='PROCESSING'
                    and lease_until>:now and expires_at>:now
                """, Map.of("id", job.id(), "token", job.leaseToken(), "stage", stage, "now", now)) == 1;
    }

    public boolean ready(Job job, String json, LocalDateTime now) {
        return jdbc.update("""
                update exam_import_jobs set status='READY_FOR_REVIEW',stage='REVIEW',
                    result_payload=:json,lease_until=null,updated_at=:now
                where id=:id and lease_token=:token and status='PROCESSING'
                    and lease_until>:now and expires_at>:now
                """, Map.of("id", job.id(), "token", job.leaseToken(), "json", json, "now", now)) == 1;
    }

    public void failed(Job job, String code, String message, LocalDateTime now) {
        jdbc.update("""
                update exam_import_jobs set status='FAILED',stage='FAILED',
                    error_code=:code,error_message=:message,lease_until=null,updated_at=:now
                where id=:id and lease_token=:token and status='PROCESSING' and lease_until>:now
                """, Map.of("id", job.id(), "token", job.leaseToken(),
                        "code", code, "message", message, "now", now));
    }

    public void recover(LocalDateTime now) {
        jdbc.update("""
                update exam_import_jobs set
                    status=case when retry_count<2 then 'QUEUED' else 'FAILED' end,
                    stage=case when retry_count<2 then 'WAITING' else 'FAILED' end,
                    error_code=case when retry_count<2 then null else 'WORKER_INTERRUPTED' end,
                    error_message=case when retry_count<2 then null else 'Job đã dừng quá số lần thử lại' end,
                    retry_count=retry_count+1,lease_token=null,lease_until=null,updated_at=:now
                where status='PROCESSING' and lease_until<=:now and expires_at>:now
                """, Map.of("now", now));
    }

    /** Retain the tombstone for idempotency; remove private payload and files separately. */
    public void expire(LocalDateTime now) {
        jdbc.update("""
                update exam_import_jobs set status='EXPIRED',stage='EXPIRED',result_payload=null,
                    lease_token=null,lease_until=null,updated_at=:now
                where expires_at<=:now and status<>'EXPIRED'
                """, Map.of("now", now));
    }

    public Set<UUID> liveIds(List<UUID> ids, LocalDateTime now) {
        if (ids.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(jdbc.query("""
                select id from exam_import_jobs where id in (:ids) and expires_at>:now
                """, Map.of("ids", ids, "now", now),
                (row, index) -> row.getObject("id", UUID.class)));
    }

    public boolean isImportDraft(UUID draftToken) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists(select 1 from exam_import_jobs where draft_token=:token)
                """, Map.of("token", draftToken), Boolean.class));
    }

    public record SaveLease(UUID token, String previousResponse) {}

    @Transactional
    public SaveLease reserveSave(UUID id, long owner, String hash, LocalDateTime now) {
        var rows = jdbc.queryForList("""
                select status,expires_at,save_hash,saved_response,save_lease_until
                from exam_import_jobs where id=:id and owner_id=:owner for update
                """, Map.of("id", id, "owner", owner));
        if (rows.isEmpty()) {
            throw new com.classmanagement.backend.exception.ResourceNotFoundException("Không tìm thấy import");
        }
        var row = rows.getFirst();
        String saved = (String) row.get("saved_response");
        if (saved != null) {
            if (!hash.equals(row.get("save_hash"))) {
                throw new ConflictException("Import đã lưu thành đề; hãy dùng API sửa đề hiện có");
            }
            return new SaveLease(null, saved);
        }
        var expiry = ((java.sql.Timestamp) row.get("expires_at")).toLocalDateTime();
        var lease = (java.sql.Timestamp) row.get("save_lease_until");
        if (!"READY_FOR_REVIEW".equals(row.get("status")) || !expiry.isAfter(now)) {
            throw new ConflictException("Preview chưa sẵn sàng hoặc đã hết hạn");
        }
        if (lease != null && lease.toLocalDateTime().isAfter(now)) {
            throw new ConflictException("Import đang được lưu, vui lòng chờ rồi thử lại");
        }
        UUID token = UUID.randomUUID();
        jdbc.update("""
                update exam_import_jobs set save_token=:token,save_hash=:hash,save_lease_until=:lease
                where id=:id
                """, Map.of("id", id, "token", token, "hash", hash, "lease", now.plusMinutes(15)));
        return new SaveLease(token, null);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void lockSave(UUID id, UUID token, LocalDateTime now) {
        var rows = jdbc.queryForList("""
                select id from exam_import_jobs where id=:id and save_token=:token
                    and saved_response is null and save_lease_until>:now
                    and expires_at>:now and status='READY_FOR_REVIEW' for update
                """, Map.of("id", id, "token", token, "now", now));
        if (rows.isEmpty()) {
            throw new ConflictException("Phiên lưu import đã hết hạn hoặc được xử lý ở nơi khác");
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void completeSave(UUID id, UUID token, String response) {
        if (jdbc.update("""
                update exam_import_jobs set saved_response=:response,save_lease_until=null,stage='SAVED'
                where id=:id and save_token=:token and saved_response is null
                """, Map.of("id", id, "token", token, "response", response)) != 1) {
            throw new ConflictException("Không xác nhận được kết quả lưu import");
        }
    }

    public void releaseSave(UUID id, UUID token) {
        jdbc.update("""
                update exam_import_jobs set save_token=null,save_lease_until=null,save_hash=null
                where id=:id and save_token=:token and saved_response is null
                """, Map.of("id", id, "token", token));
    }

    private Job map(ResultSet row, int index) throws SQLException {
        return new Job(
                row.getObject("id", UUID.class), row.getLong("owner_id"),
                row.getObject("request_id", UUID.class), row.getString("source_hash"),
                row.getLong("source_size"), row.getInt("selected_exam_number"),
                row.getString("status"), row.getString("stage"),
                row.getObject("draft_token", UUID.class), row.getString("result_payload"),
                row.getString("error_code"), row.getString("error_message"),
                row.getObject("lease_token", UUID.class),
                row.getObject("created_at", LocalDateTime.class),
                row.getObject("updated_at", LocalDateTime.class),
                row.getObject("expires_at", LocalDateTime.class), row.getString("saved_response"));
    }
}
