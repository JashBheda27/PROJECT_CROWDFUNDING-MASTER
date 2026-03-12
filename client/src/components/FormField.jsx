import React from 'react'

const FormField = ({
  labelName,
  placeholder,
  inputType,
  isTextArea,
  value,
  handleChange
}) => {
  return (
    <label className="flex-1 w-full flex flex-col">
      
      {labelName && (
        <span className="
          font-epilogue font-medium text-[14px] leading-[22px]
          text-gray-700 dark:text-gray-300
          mb-[10px] transition-colors duration-300
        ">
          {labelName}
        </span>
      )}

      {isTextArea ? (
        <textarea
          required
          value={value}
          onChange={handleChange}
          rows={10}
          placeholder={placeholder}
          className="
            py-[15px] sm:px-[25px] px-[15px]
            outline-none
            border border-gray-300 dark:border-[#3a3a43]
            bg-white dark:bg-transparent
            font-epilogue
            text-gray-800 dark:text-white
            text-[14px]
            placeholder:text-gray-400
            rounded-[12px]
            sm:min-w-[300px]
            focus:ring-2 focus:ring-purple-500
            transition-all duration-300
          "
        />
      ) : (
        <input
          required
          value={value}
          onChange={handleChange}
          type={inputType}
          step="0.1"
          placeholder={placeholder}
          className="
            py-[15px] sm:px-[25px] px-[15px]
            outline-none
            border border-gray-300 dark:border-[#3a3a43]
            bg-white dark:bg-transparent
            font-epilogue
            text-gray-800 dark:text-white
            text-[14px]
            placeholder:text-gray-400
            rounded-[12px]
            sm:min-w-[300px]
            focus:ring-2 focus:ring-purple-500
            transition-all duration-300
            dark:[color-scheme:dark]
          "
        />
      )}
    </label>
  )
}

export default FormField