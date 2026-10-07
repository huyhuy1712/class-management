export const MATH_TEMPLATES = [
  // Cơ bản
  { label: 'Phân số', symbol: 'a/b', latex: '\\frac{}{}' },
  { label: 'Hỗn số', symbol: '1 a/b', latex: '1\\frac{}{}' },
  { label: 'Căn bậc hai', symbol: '√', latex: '\\sqrt{}' },
  { label: 'Căn bậc n', symbol: 'ⁿ√', latex: '\\sqrt[]{}' },
  { label: 'Lũy thừa', symbol: 'x²', latex: '^{}' },
  { label: 'Chỉ số dưới', symbol: 'xₙ', latex: '_{}' },
  { label: 'Cộng trừ', symbol: '±', latex: '\\pm' },
  { label: 'Dấu trừ', symbol: '−', latex: '-' },
  { label: 'Nhân', symbol: '×', latex: '\\times' },
  { label: 'Chia', symbol: '÷', latex: '\\div' },

  // Giải tích
  { label: 'Nguyên hàm', symbol: '∫ f(x)dx', latex: '\\int {}\\,dx' },
  { label: 'Tích phân xác định', symbol: '∫ₐᵇ', latex: '\\int_{}^{} {}\\,dx' },
  { label: 'Đạo hàm', symbol: "f′", latex: "f'({})" },
  { label: 'Đạo hàm bậc hai', symbol: 'f″', latex: "f''({})" },
  { label: 'Giới hạn', symbol: 'lim', latex: '\\lim_{x\\to{}}' },
  { label: 'Tổng Sigma', symbol: 'Σ', latex: '\\sum_{}^{}' },

  // Lượng giác
  { label: 'Sin', symbol: 'sin', latex: '\\sin({})' },
  { label: 'Cos', symbol: 'cos', latex: '\\cos({})' },
  { label: 'Tan', symbol: 'tan', latex: '\\tan({})' },
  { label: 'Cot', symbol: 'cot', latex: '\\cot({})' },
  { label: 'Arcsin', symbol: 'arcsin', latex: '\\arcsin({})' },
  { label: 'Arccos', symbol: 'arccos', latex: '\\arccos({})' },
  { label: 'Arctan', symbol: 'arctan', latex: '\\arctan({})' },
  { label: 'Sin bình phương', symbol: 'sin²', latex: '\\sin^2({})' },
  { label: 'Cos bình phương', symbol: 'cos²', latex: '\\cos^2({})' },

  // Logarit và hằng số
  { label: 'Logarit', symbol: 'log', latex: '\\log_{}({})' },
  { label: 'Logarit tự nhiên', symbol: 'ln', latex: '\\ln({})' },
  { label: 'Số e', symbol: 'e', latex: 'e' },
  { label: 'Pi', symbol: 'π', latex: '\\pi' },
  { label: 'Đơn vị ảo', symbol: 'i', latex: 'i' },
  { label: 'Vô cực', symbol: '∞', latex: '\\infty' },

  // Chữ cái Hy Lạp
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

  // Quan hệ và ký hiệu đặc biệt
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
]
