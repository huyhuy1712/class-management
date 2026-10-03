package com.classmanagement.backend.service.excel;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class StudentExcelReader {

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "File Excel không được để trống");
        }

        String fileName = file.getOriginalFilename();

        if (fileName == null ||
                !fileName.toLowerCase().endsWith(".xlsx")) {

            throw new IllegalArgumentException(
                    "File phải có định dạng .xlsx");
        }
    }

    public void validateHeader(Sheet sheet) {
        Row header = sheet.getRow(0);

        if (header == null) {
            throw new IllegalArgumentException(
                    "File Excel không có dòng tiêu đề");
        }

        String studentCode = getCellValue(header.getCell(0));

        if (!studentCode.equalsIgnoreCase("Mã học sinh")) {

            throw new IllegalArgumentException(
                    "File Excel không đúng mẫu");
        }
    }

    public boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }

        for (Cell cell : row) {
            if (!getCellValue(cell).isBlank()) {
                return false;
            }
        }

        return true;
    }

    public String getStudentCode(Row row) {
        if (row == null) {
            return "";
        }

        // Cột A = Mã học sinh
        return getCellValue(row.getCell(0));
    }

    private String getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }

        return new DataFormatter()
                .formatCellValue(cell)
                .trim();
    }
}