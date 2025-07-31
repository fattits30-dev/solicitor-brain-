'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormField } from './form-field'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Save, X } from 'lucide-react'

const caseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  caseNumber: z.string().min(1, 'Case number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  caseType: z.enum(['civil', 'criminal', 'family', 'corporate', 'other']),
  status: z.enum(['active', 'pending', 'closed', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().optional(),
  notes: z.string().optional(),
  courtName: z.string().optional(),
  judge: z.string().optional(),
  opposingCounsel: z.string().optional(),
  nextHearing: z.string().optional(),
  filingDeadline: z.string().optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

interface CaseFormProps {
  initialData?: Partial<CaseFormData>
  onSubmit: (data: CaseFormData) => void
  onCancel?: () => void
}

export function CaseForm({ initialData, onSubmit, onCancel }: CaseFormProps) {
  const methods = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      caseNumber: '',
      clientName: '',
      caseType: 'civil',
      status: 'active',
      priority: 'medium',
      description: '',
      ...initialData
    }
  })

  const handleSubmit = methods.handleSubmit((data) => {
    onSubmit(data)
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="title"
            label="Case Title"
            placeholder="Enter case title"
          />
          <FormField
            name="caseNumber"
            label="Case Number"
            placeholder="Enter case number"
          />
        </div>

        <FormField
          name="clientName"
          label="Client Name"
          placeholder="Enter client name"
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Case Type</Label>
            <Select
              value={methods.watch('caseType')}
              onValueChange={(value) => methods.setValue('caseType', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={methods.watch('status')}
              onValueChange={(value) => methods.setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={methods.watch('priority')}
              onValueChange={(value) => methods.setValue('priority', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="courtName"
            label="Court Name"
            placeholder="Enter court name"
          />
          <FormField
            name="judge"
            label="Judge"
            placeholder="Enter judge name"
          />
        </div>

        <FormField
          name="opposingCounsel"
          label="Opposing Counsel"
          placeholder="Enter opposing counsel details"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="nextHearing"
            label="Next Hearing"
            type="datetime-local"
          />
          <FormField
            name="filingDeadline"
            label="Filing Deadline"
            type="datetime-local"
          />
        </div>

        <div className="space-y-2">
          <Label>Case Description</Label>
          <RichTextEditor
            content={methods.watch('description') || ''}
            onChange={(content) => methods.setValue('description', content)}
            placeholder="Enter case description..."
          />
        </div>

        <div className="space-y-2">
          <Label>Internal Notes</Label>
          <RichTextEditor
            content={methods.watch('notes') || ''}
            onChange={(content) => methods.setValue('notes', content)}
            placeholder="Add internal notes..."
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Case
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}