import { ArrowDown, ArrowUp } from 'lucide-react'

function ScrollButtons() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        type="button"
        aria-label="Lên đầu trang"
        title="Lên đầu trang"
        onClick={scrollToTop}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-lg transition hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-200"
      >
        <ArrowUp size={19} />
      </button>

      <button
        type="button"
        aria-label="Xuống cuối trang"
        title="Xuống cuối trang"
        onClick={scrollToBottom}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-lg transition hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-200"
      >
        <ArrowDown size={19} />
      </button>
    </div>
  )
}

export default ScrollButtons