"use client"

import { useState } from "react"
import Button from "./Button"
import LoadingModal from "./LoadingModal"

const LoadingButton = ({
  children,
  onClick,
  loadingMessage = "Processing...",
  loadingSubmessage = "",
  loadingType = "spinner",
  ...buttonProps
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e) => {
    if (onClick) {
      setIsLoading(true)
      try {
        await onClick(e)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <Button {...buttonProps} onClick={handleClick} disabled={isLoading || buttonProps.disabled}>
        {children}
      </Button>

      <LoadingModal isOpen={isLoading} message={loadingMessage} submessage={loadingSubmessage} type={loadingType} />
    </>
  )
}

export default LoadingButton
