package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.UpdateExamContentRequest.Node;
import com.classmanagement.backend.dto.exam.UpdateExamContentResponse.Mapping;
import com.classmanagement.backend.exception.ExamValidationException;
import java.util.*;
import java.util.function.*;

/** In-memory identity/diff plan. Never performs repository calls. */
final class ExamContentLayer<S extends Node, E> {
    record Entry<S extends Node>(S input, Node parent, int order) {}
    final List<Entry<S>> entries;
    final Map<Long, E> existing;
    final Set<Long> retained = new HashSet<>();
    final List<Mapping> mappings = new ArrayList<>();
    private final Function<E, Long> entityId;
    private final Function<E, Integer> order;
    private final BiConsumer<E, Integer> setOrder;

    ExamContentLayer(String name, List<Entry<S>> entries, List<E> entities,
            Function<E, Long> entityId, Function<E, Long> parentId,
            Function<E, Integer> order, BiConsumer<E, Integer> setOrder) {
        this.entries = entries; this.entityId = entityId; this.order = order; this.setOrder = setOrder;
        this.existing = new HashMap<>();
        entities.forEach(e -> existing.put(entityId.apply(e), e));
        Set<String> clientIds = new HashSet<>();
        for (var entry : entries) {
            var input = entry.input();
            if (input.clientId() != null && (input.clientId().isBlank() || !clientIds.add(input.clientId()))) {
                fail(name, "clientId trống hoặc bị trùng trong cùng loại phần tử");
            }
            if (input.id() == null) {
                if (input.clientId() == null) fail(name, "Phần tử mới phải có clientId");
            } else {
                E entity = existing.get(input.id());
                if (entity == null || !retained.add(input.id())) fail(name, "ID không thuộc đề hoặc bị trùng");
                if (entry.parent() != null && (entry.parent().id() == null
                        || !Objects.equals(parentId.apply(entity), entry.parent().id()))) {
                    fail(name, "Không được chuyển ID đã lưu sang phần tử cha khác");
                }
            }
        }
    }

    Set<Long> removed() {
        Set<Long> ids = new HashSet<>(existing.keySet()); ids.removeAll(retained); return ids;
    }

    boolean parkChangedOrder() {
        long next = Math.max(existing.values().stream().mapToInt(order::apply).max().orElse(0),
                entries.stream().mapToInt(Entry::order).max().orElse(0)) + 1L;
        boolean changed = false;
        for (var entry : entries) {
            if (entry.input().id() != null) {
                E entity = existing.get(entry.input().id());
                if (!Objects.equals(order.apply(entity), entry.order())) {
                    if (next > Integer.MAX_VALUE) fail("sections", "Thứ tự cũ vượt giới hạn cho phép");
                    setOrder.accept(entity, (int) next++); changed = true;
                }
            }
        }
        return changed;
    }

    E upsert(Entry<S> entry, Supplier<E> create, Consumer<E> configure, Consumer<E> persist) {
        E entity = entry.input().id() == null ? create.get() : existing.get(entry.input().id());
        configure.accept(entity);
        setOrder.accept(entity, entry.order());
        if (entry.input().id() == null) {
            persist.accept(entity);
            mappings.add(new Mapping(entry.input().clientId(), entityId.apply(entity)));
        }
        return entity;
    }

    private static void fail(String path, String message) {
        throw new ExamValidationException(Map.of(path, message));
    }
}

