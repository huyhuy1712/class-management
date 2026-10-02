package com.classmanagement.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_join_request_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassJoinRequestDetail {

    @Id
    @Column(name = "request_id")
    private Long requestId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "request_id")
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Classroom classroom;
}