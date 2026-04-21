"use client"

import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { FileText, Video, Mic, Image as ImageIcon, AlertCircle } from "lucide-react"

interface DocumentTabProps {
  noteId: string
}

export function DocumentTab({ noteId }: DocumentTabProps) {
  const { notes, materials } = useStore()
  
  const note = notes.find((n) => n.id === noteId)
  const material = note?.materialId ? materials.find((m) => m.id === note.materialId) : null

  if (!material) {
    return (
      <div className="flex flex-col h-[500px] items-center justify-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2 text-foreground/80">Tidak Ada Dokumen</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Catatan ini tidak dibuat dari dokumen atau link YouTube yang dapat dilampirkan, atau data sumber sudah tidak tersedia.
        </p>
      </div>
    )
  }

  // Helper to render the appropriate viewer
  const renderViewer = () => {
    switch (material.type) {
      case "video":
        // Check if it's a youtube link
        if (material.fileUrl.includes("youtube.com") || material.fileUrl.includes("youtu.be")) {
          let videoId = ""
          try {
              if (material.fileUrl.includes("v=")) {
                  videoId = new URL(material.fileUrl).searchParams.get("v") || ""
              } else {
                  videoId = material.fileUrl.split("/").pop()?.split("?")[0] || ""
              }
          } catch (e) {
              // fallback if url parsing fails
          }
            
          return (
            <iframe 
              className="w-full h-full rounded-md border-0"
              src={`https://www.youtube.com/embed/${videoId}`} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          )
        }
        return (
          <video 
            controls 
            className="w-full h-auto max-h-full rounded-md" 
            src={material.fileUrl} 
          >
            Browser Anda tidak mendukung tag video.
          </video>
        )
      case "audio":
        return (
          <div className="flex items-center justify-center h-full w-full bg-muted/20 rounded-md p-8">
             <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Mic className="h-10 w-10 text-emerald-500" />
                </div>
                <audio controls className="w-full" src={material.fileUrl}>
                  Browser Anda tidak mendukung tag audio.
                </audio>
             </div>
          </div>
        )
      case "pdf":
        return (
          <iframe 
            src={material.fileUrl} 
            className="w-full h-full rounded-md border-0"
            title={material.title || "PDF Document"}
          />
        )
      case "image":
        return (
           <div className="flex items-center justify-center h-full w-full overflow-hidden bg-muted/10 rounded-md p-4">
             <img 
               src={material.fileUrl} 
               alt={material.title || "Image content"} 
               className="max-w-full max-h-full object-contain"
             />
           </div>
        )
      default:
        // docx, pptx fallback (browsers can't natively render these easily without external services like Google Docs Viewer)
        // Note: Google Docs Viewer requires public URLs to work, so blob URLs will fail here
        if (material.fileUrl.startsWith('blob:')) {
           return (
             <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/20">
               <FileText className="h-16 w-16 text-blue-500/50 mb-4" />
               <p className="text-muted-foreground font-medium mb-2">File {material.type.toUpperCase()} diunggah secara lokal.</p>
               <p className="text-sm text-muted-foreground">Karena browser tidak bisa merender file Office secara langsung, silakan merujuk ke file asli Anda.</p>
             </div>
           )
        }
        
        return (
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(material.fileUrl)}&embedded=true`} 
            className="w-full h-full rounded-md border-0 bg-white"
            title={material.title || "Document"}
          />
        )
    }
  }

  const getIconRow = () => {
    switch (material.type) {
      case "pdf": case "docx": case "pptx": return <FileText className="h-5 w-5 text-orange-500" />
      case "video": return material.fileUrl.includes("youtu") ? <Video className="h-5 w-5 text-orange-500" /> : <Video className="h-5 w-5 text-orange-500" />
      case "audio": return <Mic className="h-5 w-5 text-orange-500" />
      case "image": return <ImageIcon className="h-5 w-5 text-orange-500" />
      default: return <FileText className="h-5 w-5 text-orange-500" />
    }
  }

  return (
    <div className="flex flex-col h-full w-full flex-1 gap-4 p-2 outline-none">
      <div className="flex items-center gap-2 border-b pb-3 pt-2 px-2 shrink-0">
        {getIconRow()}
        <h2 className="text-lg font-semibold truncate leading-none pt-1">
          {material.title || material.fileName || "Dokumen Sumber"}
        </h2>
      </div>
      
      <Card className="flex-1 bg-background/50 border overflow-hidden min-h-[500px] h-[calc(100vh-250px)] flex flex-col items-center justify-center p-1 relative mb-4">
        {renderViewer()}
      </Card>
      
      {material.fileUrl && material.fileUrl.startsWith('blob:') && (
         <p className="text-xs text-muted-foreground/60 text-center pb-4 absolute bottom-0 left-0 right-0">
            *Dokumen ini dimuat secara lokal dan mungkin tidak tersedia jika Anda memuat ulang halaman.
         </p>
      )}
    </div>
  )
}
