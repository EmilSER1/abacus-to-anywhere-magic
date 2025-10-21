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

interface AddDepartmentDialogProps {
  floor: string
  block?: string
}

export function AddDepartmentDialog({ floor, block = 'A' }: AddDepartmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    block: block,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Создаем новое отделение с базовым кабинетом
      const { error } = await supabase
        .from('projector_floors')
        .insert({
          'ЭТАЖ': floor,
          'БЛОК': formData.block.trim(),
          'ОТДЕЛЕНИЕ': formData.name.trim(),
          'КОД ПОМЕЩЕНИЯ': '',
          'НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ': 'Кабинет 1',
          'Площадь (м2)': 0
        })

      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['projector-floors'] })
      
      toast.success('Отделение успешно добавлено')
      setOpen(false)
      setFormData({ name: '', block: block })
    } catch (error) {
      console.error('Error adding department:', error)
      toast.error('Ошибка при добавлении отделения')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
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
          Добавить отделение
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Добавить отделение</DialogTitle>
            <DialogDescription>
              Создание нового отделения на {floor} этаже
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Название отделения</Label>
              <Input
                id="dept-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Введите название отделения"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dept-block">Блок</Label>
              <Input
                id="dept-block"
                value={formData.block}
                onChange={(e) => handleInputChange('block', e.target.value)}
                placeholder="Например: A, B, C"
                required
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
