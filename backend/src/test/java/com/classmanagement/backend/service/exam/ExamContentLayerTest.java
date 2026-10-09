package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.UpdateExamContentRequest;
import com.classmanagement.backend.entity.ExamSection;
import com.classmanagement.backend.exception.ExamValidationException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamContentLayerTest {
    private UpdateExamContentRequest.Section input(Long id, String client) {
        return new UpdateExamContentRequest.Section(id, client, "Section", null, null, null, List.of());
    }
    private ExamContentLayer<UpdateExamContentRequest.Section, ExamSection> layer(
            List<ExamContentLayer.Entry<UpdateExamContentRequest.Section>> entries, List<ExamSection> old) {
        return new ExamContentLayer<>("sections", entries, old, ExamSection::getId,
                s -> 7L, ExamSection::getOrderIndex, ExamSection::setOrderIndex);
    }
    @Test void swapsParkBothOutsideAllFinalPositions() {
        var first = ExamSection.builder().id(1L).orderIndex(1).build();
        var second = ExamSection.builder().id(2L).orderIndex(2).build();
        var plan = layer(List.of(new ExamContentLayer.Entry<>(input(2L, null), null, 1),
                new ExamContentLayer.Entry<>(input(1L, null), null, 2)), List.of(first, second));
        assertTrue(plan.parkChangedOrder());
        assertTrue(first.getOrderIndex() > 2); assertTrue(second.getOrderIndex() > 2);
        assertNotEquals(first.getOrderIndex(), second.getOrderIndex());
    }
    @Test void insertionParkingAlsoExceedsNewPositions() {
        var old = ExamSection.builder().id(1L).orderIndex(1).build();
        var plan = layer(List.of(new ExamContentLayer.Entry<>(input(null, "new"), null, 1),
                new ExamContentLayer.Entry<>(input(1L, null), null, 2)), List.of(old));
        plan.parkChangedOrder(); assertTrue(old.getOrderIndex() > 2);
    }
    @Test void unchangedOrderNeedsNoParking() {
        assertFalse(layer(List.of(new ExamContentLayer.Entry<>(input(1L, null), null, 1)),
                List.of(ExamSection.builder().id(1L).orderIndex(1).build())).parkChangedOrder());
    }
    @Test void rejectsDuplicateIds() {
        var old = ExamSection.builder().id(1L).orderIndex(1).build();
        assertThrows(ExamValidationException.class, () -> layer(List.of(
                new ExamContentLayer.Entry<>(input(1L, null), null, 1),
                new ExamContentLayer.Entry<>(input(1L, null), null, 2)), List.of(old)));
    }
    @Test void rejectsNewNodeWithoutClientId() {
        assertThrows(ExamValidationException.class, () -> layer(List.of(
                new ExamContentLayer.Entry<>(input(null, null), null, 1)), List.of()));
    }
    @Test void rejectsDuplicateClientId() {
        assertThrows(ExamValidationException.class, () -> layer(List.of(
                new ExamContentLayer.Entry<>(input(null, "same"), null, 1),
                new ExamContentLayer.Entry<>(input(null, "same"), null, 2)), List.of()));
    }
    @Test void rejectsMovingExistingNodeToAnotherParent() {
        var old = ExamSection.builder().id(1L).orderIndex(1).build();
        assertThrows(ExamValidationException.class, () -> layer(List.of(
                new ExamContentLayer.Entry<>(input(1L, null), input(8L, null), 1)), List.of(old)));
    }
}
