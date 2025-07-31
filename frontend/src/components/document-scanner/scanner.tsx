'use client'

import { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Camera, 
  Upload, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentScannerProps {
  onScanComplete?: (text: string, image: string) => void
  className?: string
}

export function DocumentScanner({ onScanComplete, className }: DocumentScannerProps) {
  const [mode, setMode] = useState<'camera' | 'upload' | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const captureImage = () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImage(imageSrc)
      setMode(null)
      processImage(imageSrc)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageSrc = event.target?.result as string
        setImage(imageSrc)
        setMode(null)
        processImage(imageSrc)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (imageSrc: string) => {
    setScanning(true)
    setError(null)
    setProgress(0)

    try {
      const result = await Tesseract.recognize(
        imageSrc,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )
      
      setExtractedText(result.data.text)
      onScanComplete?.(result.data.text, imageSrc)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error('OCR error:', err)
    } finally {
      setScanning(false)
    }
  }

  const reset = () => {
    setMode(null)
    setImage(null)
    setExtractedText('')
    setError(null)
    setProgress(0)
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Document Scanner</h3>
          {image && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {!mode && !image && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => setMode('camera')}
            >
              <Camera className="h-8 w-8" />
              <span>Use Camera</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8" />
              <span>Upload Image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={captureImage} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {image && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-gray-900">
              <img
                src={image}
                alt="Scanned document"
                className="w-full"
              />
              {scanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Processing... {progress}%</p>
                  </div>
                </div>
              )}
            </div>

            {extractedText && !scanning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Text extracted successfully</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">{extractedText}</pre>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}