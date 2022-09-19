import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
    plugins: [react()],
    define: {
        "__APP_VERSION__": JSON.stringify(process.env.npm_package_version)
    }
})