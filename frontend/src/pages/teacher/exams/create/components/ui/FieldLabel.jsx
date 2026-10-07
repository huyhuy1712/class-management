function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#18301D]">
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  )
}

export default FieldLabel