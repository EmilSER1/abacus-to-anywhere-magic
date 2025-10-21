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
import { Plus, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

interface AddRoomDialogProps {
  floor: string
  block: string
  department: string
}

export function AddRoomDialog({ floor, block, department }: AddRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    area: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('projector_floors')
        .insert({
          'ЭТАЖ': floor,
          'БЛОК': block,
          'ОТДЕЛЕНИЕ': department,
          'КОД ПОМЕЩЕНИЯ': formData.code.trim(),
          'НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ': formData.name.trim(),
          'Площадь (м2)': formData.area
        })

      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['projector-floors'] })
      
      toast.success('Кабинет успешно добавлен')
      setOpen(false)
      setFormData({ name: '', code: '', area: 0 })
    } catch (error) {
      console.error('Error adding room:', error)
      toast.error('Ошибка при добавлении кабинета')
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
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="w-3 h-3" />
          Добавить кабинет
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Добавить кабинет</DialogTitle>
            <DialogDescription>
              Создание нового кабинета в отделении {department}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-room-name">Название кабинета</Label>
              <Input
                id="new-room-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Введите название кабинета"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-room-code">Код кабинета</Label>
              <Input
                id="new-room-code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Например: C101"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-room-area">Площадь (м²)</Label>
              <Input
                id="new-room-area"
                type="number"
                value={formData.area}
                onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                placeholder="Площадь в квадратных метрах"
                min="0"
                step="0.1"
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
              {loading ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
