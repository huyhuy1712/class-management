import { MATH_BRACKETS } from './mathBrackets.js'

const numberedList = (labels) => `\\begin{array}{ll}${labels.map((label) => `\\text{${label}.}&\\text{\\placeholder{}}`).join('\\\\')}\\end{array}`

export const MATH_TEMPLATE_GROUPS = [
  { id: 'formatting', label: 'Định dạng', items: [
    {"label": "In nghiêng", "symbol": "𝑰", "latex": "\\textit{\\placeholder{}}", "format": "italic"},
    {"label": "In đậm", "symbol": "𝐁", "latex": "\\textbf{\\placeholder{}}", "format": "bold"},
    { label: 'Danh sách theo số', symbol: '1. 2. 3.', latex: numberedList(['1', '2', '3']) },
    { label: 'Danh sách theo chữ', symbol: 'a. b. c.', latex: numberedList(['a', 'b', 'c']) },
  ] },
  {
    id: 'accents', label: 'Dấu trên/dưới', items: [
      { label: 'Gạch chân chữ', symbol: 'a̲', latex: '\\underline{\\text{\\placeholder{}}}' },
      { label: 'Gạch chân biểu thức', symbol: 'x̲', latex: '\\underline{\\placeholder{}}' },
      { label: 'Gạch trên', symbol: 'x̅', latex: '\\overline{\\placeholder{}}' },
      { label: 'Vectơ nhiều ký tự', symbol: 'AB⃗', latex: '\\overrightarrow{\\placeholder{}}' },
      { label: 'Dấu góc', symbol: 'Â', latex: '\\widehat{\\placeholder{}}' },
    ],
  },
  {
    id: 'brackets', label: 'Ngoặc', items: [
      {"label": "Ngoặc tròn", "symbol": "( )", "latex": "\\left(\\placeholder{}\\right)"},
      {"label": "Ngoặc tròn mở", "symbol": "(", "latex": "("},
      {"label": "Ngoặc tròn đóng", "symbol": ")", "latex": ")"},

      { label: 'Hệ ngoặc nhọn', symbol: '{', latex: MATH_BRACKETS['{'] },
      { label: 'Hệ ngoặc vuông', symbol: '[', latex: MATH_BRACKETS['['] },
    ],
  },
  {
    id: 'basic', label: 'Cơ bản', items: [
      { label: 'Phân số', symbol: 'a/b', latex: '\\frac{}{}' },
      { label: 'Hỗn số', symbol: '1 a/b', latex: '1\\frac{}{}' },
      { label: 'Căn bậc hai', symbol: '√', latex: '\\sqrt{\\placeholder{}}' },
      { label: 'Căn bậc n', symbol: 'ⁿ√', latex: '\\sqrt[\\placeholder{}]{\\placeholder{}}' },
      { label: 'Lũy thừa', symbol: 'x²', latex: '^{}' },
      { label: 'Chỉ số dưới', symbol: 'xₙ', latex: '_{}' },
      { label: 'Cộng trừ', symbol: '±', latex: '\\pm' },
      { label: 'Dấu trừ', symbol: '−', latex: '-' },
      { label: 'Nhân', symbol: '×', latex: '\\times' },
      { label: 'Chia', symbol: '÷', latex: '\\div' },
    ],
  },
  {
    id: 'calculus', label: 'Giải tích', items: [
      { label: 'Nguyên hàm', symbol: '∫ f(x)dx', latex: '\\int {}\\,dx' },
      { label: 'Tích phân xác định', symbol: '∫ₐᵇ', latex: '\\int_{}^{} {}\\,dx' },
      { label: 'Đạo hàm', symbol: 'f′', latex: "f'({})" },
      { label: 'Đạo hàm bậc hai', symbol: 'f″', latex: "f''({})" },
      { label: 'Giới hạn', symbol: 'lim', latex: '\\lim_{x\\to{}}' },
      { label: 'Tổng Sigma', symbol: 'Σ', latex: '\\sum_{}^{}' },
    ],
  },
  {
    id: 'trigonometry', label: 'Lượng giác', items: [
      { label: 'Sin', symbol: 'sin', latex: '\\sin({})' },
      { label: 'Cos', symbol: 'cos', latex: '\\cos({})' },
      { label: 'Tan', symbol: 'tan', latex: '\\tan({})' },
      { label: 'Cot', symbol: 'cot', latex: '\\cot({})' },
      { label: 'Arcsin', symbol: 'arcsin', latex: '\\arcsin({})' },
      { label: 'Arccos', symbol: 'arccos', latex: '\\arccos({})' },
      { label: 'Arctan', symbol: 'arctan', latex: '\\arctan({})' },
      { label: 'Sin bình phương', symbol: 'sin²', latex: '\\sin^2({})' },
      { label: 'Cos bình phương', symbol: 'cos²', latex: '\\cos^2({})' },
    ],
  },
  {
    id: 'constants', label: 'Hằng số', items: [
      { label: 'Logarit không ghi cơ số', symbol: 'log()', latex: '\\log(\\placeholder{})' },
      { label: 'Logarit có cơ số', symbol: 'logₐ()', latex: '\\log_{\\placeholder{}}(\\placeholder{})' },
      { label: 'Logarit tự nhiên', symbol: 'ln', latex: '\\ln({})' },
      { label: 'Số e', symbol: 'e', latex: 'e' },
      { label: 'Pi', symbol: 'π', latex: '\\pi' },
      { label: 'Đơn vị ảo', symbol: 'i', latex: 'i' },
      { label: 'Vô cực', symbol: '∞', latex: '\\infty' },
    ],
  },
  {
    id: 'greek', label: 'Hy Lạp', items: [
      { label: 'Alpha', symbol: 'α', latex: '\\alpha' },
      { label: 'Beta', symbol: 'β', latex: '\\beta' },
      { label: 'Gamma', symbol: 'γ', latex: '\\gamma' },
      { label: 'Delta', symbol: 'δ', latex: '\\delta' },
      { label: 'Theta', symbol: 'θ', latex: '\\theta' },
      { label: 'Lambda', symbol: 'λ', latex: '\\lambda' },
      { label: 'Mu', symbol: 'μ', latex: '\\mu' },
      { label: 'Sigma', symbol: 'σ', latex: '\\sigma' },
      { label: 'Phi', symbol: 'φ', latex: '\\phi' },
      { label: 'Omega', symbol: 'ω', latex: '\\omega' },
      { label: 'Delta hoa', symbol: 'Δ', latex: '\\Delta' },
    ],
  },
  {
    id: 'symbols', label: 'Ký hiệu', items: [
      { label: 'Tập rỗng', symbol: '∅', latex: '\\varnothing' },
      { label: 'Phần bù của tập hợp', symbol: 'Aᶜ', latex: '\\placeholder{}^{c}' },
      { label: 'Tổ hợp', symbol: 'Cₙᵏ', latex: 'C_{\\placeholder{}}^{\\placeholder{}}' },
      { label: 'Chỉnh hợp', symbol: 'Aₙᵏ', latex: 'A_{\\placeholder{}}^{\\placeholder{}}' },
      { label: 'Xác suất', symbol: 'P(A)', latex: 'P(\\placeholder{})' },
      { label: 'Hoán vị', symbol: 'Pₙ', latex: 'P_{\\placeholder{}}' },
      { label: 'Tam giác', symbol: '△', latex: '\\triangle' },
      { label: 'Vuông góc', symbol: '⊥', latex: '\\perp' },
      { label: 'Song song', symbol: '∥', latex: '\\parallel' },
      { label: 'Chia hết', symbol: '⋮', latex: '\\vdots' },
      { label: 'Tồn tại', symbol: '∃', latex: '\\exists' },
      { label: 'Với mọi', symbol: '∀', latex: '\\forall' },
      { label: 'Khác', symbol: '≠', latex: '\\neq' },
      { label: 'Xấp xỉ', symbol: '≈', latex: '\\approx' },
      { label: 'Lớn hơn hoặc bằng', symbol: '≥', latex: '\\geq' },
      { label: 'Nhỏ hơn hoặc bằng', symbol: '≤', latex: '\\leq' },
      { label: 'Thuộc', symbol: '∈', latex: '\\in' },
      { label: 'Không thuộc', symbol: '∉', latex: '\\notin' },
      { label: 'Tập con', symbol: '⊂', latex: '\\subset' },
      { label: 'Hợp', symbol: '∪', latex: '\\cup' },
      { label: 'Giao', symbol: '∩', latex: '\\cap' },
      { label: 'Suy ra', symbol: '⇒', latex: '\\Rightarrow' },
      { label: 'Tương đương', symbol: '⇔', latex: '\\Leftrightarrow' },
      { label: 'Góc', symbol: '∠', latex: '\\angle' },
      { label: 'Độ', symbol: '°', latex: '^\\circ' },
    ],
  },
]

export const MATH_TEMPLATES = MATH_TEMPLATE_GROUPS.flatMap((group) => group.items)
