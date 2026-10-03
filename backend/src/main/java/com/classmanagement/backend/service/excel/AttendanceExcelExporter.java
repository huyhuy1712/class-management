package com.classmanagement.backend.service.excel;

import com.classmanagement.backend.dto.attendance.AttendanceExportRow;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Component
public class AttendanceExcelExporter {

    public byte[] export(List<AttendanceExportRow> rows) {

        try (
                Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Điểm danh");

            createHeader(sheet, workbook);
            createDataRows(sheet, workbook, rows);
            autoSizeColumns(sheet);

            workbook.write(outputStream);

            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Không thể tạo file Excel điểm danh");
        }
    }

    private void createHeader(
            Sheet sheet,
            Workbook workbook) {
        Row header = sheet.createRow(0);

        CellStyle headerStyle = createHeaderStyle(workbook);

        createCell(
                header,
                0,
                "Mã học sinh",
                headerStyle);

        createCell(
                header,
                1,
                "Họ và tên",
                headerStyle);

        createCell(
                header,
                2,
                "Điểm danh",
                headerStyle);
    }

    private void createDataRows(
            Sheet sheet,
            Workbook workbook,
            List<AttendanceExportRow> rows) {

        CellStyle presentStyle = createStatusStyle(
                workbook,
                IndexedColors.LIGHT_GREEN);

        CellStyle absentStyle = createStatusStyle(
                workbook,
                IndexedColors.ROSE);

        CellStyle lateStyle = createStatusStyle(
                workbook,
                IndexedColors.LIGHT_YELLOW);

        int rowIndex = 1;

        for (AttendanceExportRow data : rows) {

            Row row = sheet.createRow(rowIndex++);

            createCell(
                    row,
                    0,
                    data.getStudentCode(),
                    null);

            createCell(
                    row,
                    1,
                    data.getFullName(),
                    null);

            createCell(
                    row,
                    2,
                    data.getStatus().name(),
                    getStatusStyle(
                            data,
                            presentStyle,
                            absentStyle,
                            lateStyle));
        }
    }

    private CellStyle createHeaderStyle(
            Workbook workbook) {
        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();

        font.setBold(true);

        style.setFont(font);

        style.setAlignment(
                HorizontalAlignment.CENTER);

        return style;
    }

    private CellStyle createStatusStyle(
            Workbook workbook,
            IndexedColors color) {
        CellStyle style = workbook.createCellStyle();

        style.setFillForegroundColor(
                color.getIndex());

        style.setFillPattern(
                FillPatternType.SOLID_FOREGROUND);

        style.setAlignment(
                HorizontalAlignment.CENTER);

        return style;
    }

    private CellStyle getStatusStyle(
            AttendanceExportRow row,
            CellStyle presentStyle,
            CellStyle absentStyle,
            CellStyle lateStyle) {
        return switch (row.getStatus()) {

            case PRESENT ->
                presentStyle;

            case ABSENT ->
                absentStyle;

            case LATE ->
                lateStyle;
        };
    }

    private void createCell(
            Row row,
            int column,
            String value,
            CellStyle style) {
        Cell cell = row.createCell(column);

        cell.setCellValue(
                value != null ? value : "");

        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private void autoSizeColumns(
            Sheet sheet) {
        for (int i = 0; i < 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}