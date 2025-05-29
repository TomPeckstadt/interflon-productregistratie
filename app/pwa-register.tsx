"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("Service Worker registratie succesvol met scope: ", registration.scope)
          },
          (err) => {
            console.log("Service Worker registratie mislukt: ", err)
          },
        )
      })
    }
  }, [])

  return null
}
