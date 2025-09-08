import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Room {
  id: string
  name: string
  code?: string | null
  area?: number | null
  description?: string | null
}

interface EditRoomDialogProps {
  room: Room
  type?: 'regular' | 'turar'
}

export function EditRoomDialog({ room, type = 'regular' }: EditRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: room.name,
    code: room.code || '',
    area: room.area || 0,
    description: room.description || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Кабинет успешно обновлен')
      setOpen(false)
    } catch (error) {
      toast.error('Ошибка при обновлении кабинета')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
          <Edit className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Редактировать кабинет</DialogTitle>
            <DialogDescription>
              Изменение информации о кабинете {room.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Название кабинета</Label>
              <Input
                id="room-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Введите название кабинета"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-code">Код кабинета</Label>
              <Input
                id="room-code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Например: C101"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-area">Площадь (м²)</Label>
              <Input
                id="room-area"
                type="number"
                value={formData.area}
                onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                placeholder="Площадь в квадратных метрах"
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-description">Описание</Label>
              <Textarea
                id="room-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Описание кабинета"
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="medical-button">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}