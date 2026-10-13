// UI preview only: no answer key, score or real attempt is created.
export const studentExamPaper = {
  title: 'Bài kiểm tra mẫu — Toán và đọc hiểu', code: 'PREVIEW-01', durationMinutes: 20,
  sections: [
    { id: 'math', title: 'Phần I · Trắc nghiệm', description: 'Chọn đáp án phù hợp. Câu nhiều lựa chọn có thể chọn hơn một đáp án.', questions: [
      { id: 'q1', type: 'SINGLE', content: 'Nghiệm của phương trình $2x + 4 = 10$ là:', options: ['1', '2', '3', '4'] },
      { id: 'q2', type: 'MULTIPLE', content: 'Chọn các số nguyên tố trong các số sau:', options: ['2', '4', '5', '9'] },
      { id: 'q3', type: 'SINGLE', content: 'Đạo hàm của hàm số $f(x)=x^2$ là:', options: ['$2x$', '$x$', '$x^3$', '$2$'] },
    ] },
    { id: 'reasoning', title: 'Phần II · Đúng / Sai', description: 'Chọn Đúng hoặc Sai cho từng ý.', questions: [
      { id: 'q4', type: 'TRUE_FALSE', content: 'Xét các nhận định về hình vuông:', statements: ['Bốn cạnh có độ dài bằng nhau.', 'Hai đường chéo vuông góc với nhau.', 'Mọi hình chữ nhật đều là hình vuông.', 'Tổng bốn góc trong bằng 360°.'] },
    ] },
    { id: 'short', title: 'Phần III · Trả lời ngắn', questions: [
      { id: 'q5', type: 'SHORT', content: 'Một hình chữ nhật dài 8 cm, rộng 5 cm. Diện tích của hình là bao nhiêu cm²?' },
    ] },
    { id: 'reading', title: 'Phần IV · Tự luận', description: 'Đọc đoạn văn và trình bày ý kiến của bạn.', paragraph: 'Việc học không chỉ là ghi nhớ kiến thức. Khi đặt câu hỏi, thử nghiệm và nhìn lại những sai sót, người học hiểu sâu hơn và tìm được cách giải quyết vấn đề phù hợp.', questions: [
      { id: 'q6', type: 'ESSAY', content: 'Theo bạn, vì sao việc nhìn lại sai sót có thể giúp học tốt hơn? Viết một đoạn văn ngắn.' },
    ] },
  ],
}
