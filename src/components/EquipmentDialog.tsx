import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Equipment, useUpdateEquipment, useAddEquipment } from '@/hooks/useRoomEquipment';
import { Plus, X, ChevronDown } from 'lucide-react';
import { toast } from "sonner";

interface EquipmentDialogProps {
  equipment: Equipment | null;
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export const EquipmentDialog: React.FC<EquipmentDialogProps> = ({
  equipment,
  roomId,
  isOpen,
  onClose,
  isNew = false,
}) => {
  const updateEquipment = useUpdateEquipment();
  const addEquipment = useAddEquipment();

  const [formData, setFormData] = useState({
    equipment_code: '',
    equipment_name: '',
    model_name: '',
    equipment_code_required: '',
    equipment_type: '' as 'МИ' | 'не МИ' | '',
    brand: '',
    country: '',
    specification: '',
    documents: [] as Array<{ url: string; name: string }>,
    standard: '',
    // Technical specifications
    dimensions: '',
    humidity_temperature: '',
    voltage: '',
    frequency: '',
    power_watts: '',
    power_watts_peak: '',
    ups: '',
    floor_load: '',
    floor_load_heaviest: '',
    ceiling_load_heaviest: '',
    chiller: false,
    exhaust: '',
    drainage: '',
    hot_water: '',
    cold_water: '',
    distilled_water: '',
    neutralization_tank: '',
    data_requirements: '',
    emergency_buttons: '',
    xray_warning_lamps: '',
    raised_floor: '',
    ceiling_drops: '',
    precision_ac: false,
    medical_gas_o2: '',
    medical_gas_ma4: '',
    medical_gas_ma7: '',
    medical_gas_n2o: '',
    medical_gas_other: '',
    other_requirements: '',
    // Purchase information
    purchase_price: null as number | null,
    price_updated_at: null as string | null,
    incoterms: '',
    supplier: '',
    supplier_status: '',
    supplier_contacts: [] as Array<{ name: string; phones: string[]; emails: string[]; city: string; address: string }>,
  });

  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [techSpecsOpen, setTechSpecsOpen] = useState(false);

  useEffect(() => {
    if (equipment) {
      setFormData({
        equipment_code: equipment.equipment_code || '',
        equipment_name: equipment.equipment_name || '',
        model_name: equipment.model_name || '',
        equipment_code_required: equipment.equipment_code_required || '',
        equipment_type: equipment.equipment_type || '',
        brand: equipment.brand || '',
        country: equipment.country || '',
        specification: equipment.specification || '',
        documents: equipment.documents || [],
        standard: equipment.standard || '',
        dimensions: equipment.dimensions || '',
        humidity_temperature: equipment.humidity_temperature || '',
        voltage: equipment.voltage || '',
        frequency: equipment.frequency || '',
        power_watts: equipment.power_watts || '',
        power_watts_peak: equipment.power_watts_peak || '',
        ups: equipment.ups || '',
        floor_load: equipment.floor_load || '',
        floor_load_heaviest: equipment.floor_load_heaviest || '',
        ceiling_load_heaviest: equipment.ceiling_load_heaviest || '',
        chiller: equipment.chiller || false,
        exhaust: equipment.exhaust || '',
        drainage: equipment.drainage || '',
        hot_water: equipment.hot_water || '',
        cold_water: equipment.cold_water || '',
        distilled_water: equipment.distilled_water || '',
        neutralization_tank: equipment.neutralization_tank || '',
        data_requirements: equipment.data_requirements || '',
        emergency_buttons: equipment.emergency_buttons || '',
        xray_warning_lamps: equipment.xray_warning_lamps || '',
        raised_floor: equipment.raised_floor || '',
        ceiling_drops: equipment.ceiling_drops || '',
        precision_ac: equipment.precision_ac || false,
        medical_gas_o2: equipment.medical_gas_o2 || '',
        medical_gas_ma4: equipment.medical_gas_ma4 || '',
        medical_gas_ma7: equipment.medical_gas_ma7 || '',
        medical_gas_n2o: equipment.medical_gas_n2o || '',
        medical_gas_other: equipment.medical_gas_other || '',
        other_requirements: equipment.other_requirements || '',
        purchase_price: equipment.purchase_price || null,
        price_updated_at: equipment.price_updated_at || null,
        incoterms: equipment.incoterms || '',
        supplier: equipment.supplier || '',
        supplier_status: equipment.supplier_status || '',
        supplier_contacts: equipment.supplier_contacts || [],
      });
    } else {
      setFormData({
        equipment_code: '',
        equipment_name: '',
        model_name: '',
        equipment_code_required: '',
        equipment_type: '',
        brand: '',
        country: '',
        specification: '',
        documents: [],
        standard: '',
        dimensions: '',
        humidity_temperature: '',
        voltage: '',
        frequency: '',
        power_watts: '',
        power_watts_peak: '',
        ups: '',
        floor_load: '',
        floor_load_heaviest: '',
        ceiling_load_heaviest: '',
        chiller: false,
        exhaust: '',
        drainage: '',
        hot_water: '',
        cold_water: '',
        distilled_water: '',
        neutralization_tank: '',
        data_requirements: '',
        emergency_buttons: '',
        xray_warning_lamps: '',
        raised_floor: '',
        ceiling_drops: '',
        precision_ac: false,
        medical_gas_o2: '',
        medical_gas_ma4: '',
        medical_gas_ma7: '',
        medical_gas_n2o: '',
        medical_gas_other: '',
        other_requirements: '',
        purchase_price: null,
        price_updated_at: null,
        incoterms: '',
        supplier: '',
        supplier_status: '',
        supplier_contacts: [],
      });
    }
    setNewDocumentUrl('');
    setNewDocumentName('');
  }, [equipment]);

  const handleAddDocumentUrl = () => {
    if (!newDocumentUrl.trim()) {
      toast.error("Введите ссылку на документ");
      return;
    }
    if (!newDocumentName.trim()) {
      toast.error("Введите название документа");
      return;
    }

    setFormData({
      ...formData,
      documents: [...formData.documents, { url: newDocumentUrl.trim(), name: newDocumentName.trim() }],
    });
    setNewDocumentUrl('');
    setNewDocumentName('');
    toast.success("Ссылка добавлена");
  };

  const handleDeleteDocumentUrl = (index: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    });
    toast.success("Ссылка удалена");
  };

  const handleSave = () => {
    // Если есть незавершенный документ в полях ввода, добавляем его
    const finalDocuments = [...formData.documents];
    if (newDocumentUrl.trim() && newDocumentName.trim()) {
      finalDocuments.push({ 
        url: newDocumentUrl.trim(), 
        name: newDocumentName.trim() 
      });
    }

    if (isNew) {
      addEquipment.mutate({
        room_id: roomId,
        ...formData,
        documents: finalDocuments,
        equipment_type: formData.equipment_type || null,
        quantity: null,
        unit: null,
        notes: null,
      });
    } else if (equipment) {
      updateEquipment.mutate({
        id: equipment.id,
        room_id: equipment.room_id,
        ...formData,
        documents: finalDocuments,
        equipment_type: formData.equipment_type || null,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Добавить оборудование' : 'Редактировать оборудование'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="equipment_code">Код оборудования</Label>
            <Input
              id="equipment_code"
              value={formData.equipment_code}
              onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equipment_name">Наименование *</Label>
            <Input
              id="equipment_name"
              value={formData.equipment_name}
              onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="model_name">Наименование (модель)</Label>
            <Input
              id="model_name"
              value={formData.model_name}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equipment_code_required">Код оборудования*</Label>
            <Input
              id="equipment_code_required"
              value={formData.equipment_code_required}
              onChange={(e) => setFormData({ ...formData, equipment_code_required: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equipment_type">Вид</Label>
            <Select
              value={formData.equipment_type}
              onValueChange={(value: 'МИ' | 'не МИ') => 
                setFormData({ ...formData, equipment_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите вид" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="МИ">МИ</SelectItem>
                <SelectItem value="не МИ">не МИ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brand">Бренд</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country">Страна</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="specification">Спецификация</Label>
            <Textarea
              id="specification"
              value={formData.specification}
              onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Ссылки на документы</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="text"
                  placeholder="Название документа"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  value={newDocumentUrl}
                  onChange={(e) => setNewDocumentUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDocumentUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddDocumentUrl}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {formData.documents.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.name}</div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                      >
                        {doc.url}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocumentUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="standard">Стандарт</Label>
            <Input
              id="standard"
              value={formData.standard}
              onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
            />
          </div>

          <Collapsible open={techSpecsOpen} onOpenChange={setTechSpecsOpen} className="border rounded-lg p-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" type="button">
                <span className="font-semibold">Технические характеристики</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${techSpecsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dimensions">Размеры (Ш/Д/В), мм</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="humidity_temperature">Влажность и температура</Label>
                  <Input
                    id="humidity_temperature"
                    value={formData.humidity_temperature}
                    onChange={(e) => setFormData({ ...formData, humidity_temperature: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="voltage">Вольт</Label>
                  <Input
                    id="voltage"
                    value={formData.voltage}
                    onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frequency">Частота</Label>
                  <Input
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="power_watts">Мощность в Ватт</Label>
                  <Input
                    id="power_watts"
                    value={formData.power_watts}
                    onChange={(e) => setFormData({ ...formData, power_watts: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="power_watts_peak">Мощность Ватт пиковая</Label>
                  <Input
                    id="power_watts_peak"
                    value={formData.power_watts_peak}
                    onChange={(e) => setFormData({ ...formData, power_watts_peak: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ups">Источник бесперебойного питания</Label>
                  <Input
                    id="ups"
                    value={formData.ups}
                    onChange={(e) => setFormData({ ...formData, ups: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="floor_load">Нагрузка на пол</Label>
                  <Input
                    id="floor_load"
                    value={formData.floor_load}
                    onChange={(e) => setFormData({ ...formData, floor_load: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="floor_load_heaviest">Самая тяжелая часть (пол)</Label>
                  <Input
                    id="floor_load_heaviest"
                    value={formData.floor_load_heaviest}
                    onChange={(e) => setFormData({ ...formData, floor_load_heaviest: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ceiling_load_heaviest">Нагрузка на потолок (самая тяжелая часть)</Label>
                  <Input
                    id="ceiling_load_heaviest"
                    value={formData.ceiling_load_heaviest}
                    onChange={(e) => setFormData({ ...formData, ceiling_load_heaviest: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="chiller" className="flex items-center gap-2">
                    Чиллер
                    <Switch
                      id="chiller"
                      checked={formData.chiller}
                      onCheckedChange={(checked) => setFormData({ ...formData, chiller: checked })}
                    />
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="exhaust">Вытяжка (Диаметр и расход)</Label>
                  <Input
                    id="exhaust"
                    value={formData.exhaust}
                    onChange={(e) => setFormData({ ...formData, exhaust: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="drainage">Дренаж (Диаметр и расход)</Label>
                  <Input
                    id="drainage"
                    value={formData.drainage}
                    onChange={(e) => setFormData({ ...formData, drainage: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hot_water">Горячая вода (Диаметр и расход)</Label>
                  <Input
                    id="hot_water"
                    value={formData.hot_water}
                    onChange={(e) => setFormData({ ...formData, hot_water: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cold_water">Холодная вода (Диаметр и расход)</Label>
                  <Input
                    id="cold_water"
                    value={formData.cold_water}
                    onChange={(e) => setFormData({ ...formData, cold_water: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="distilled_water">Дистиллированная вода (Диаметр и расход)</Label>
                  <Input
                    id="distilled_water"
                    value={formData.distilled_water}
                    onChange={(e) => setFormData({ ...formData, distilled_water: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="neutralization_tank">Дренаж - резервуар для нейтрализации</Label>
                  <Input
                    id="neutralization_tank"
                    value={formData.neutralization_tank}
                    onChange={(e) => setFormData({ ...formData, neutralization_tank: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="data_requirements">Требования к данным (Тип и количество)</Label>
                  <Input
                    id="data_requirements"
                    value={formData.data_requirements}
                    onChange={(e) => setFormData({ ...formData, data_requirements: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="emergency_buttons">Кнопки экстренного вызова (Количество)</Label>
                  <Input
                    id="emergency_buttons"
                    value={formData.emergency_buttons}
                    onChange={(e) => setFormData({ ...formData, emergency_buttons: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="xray_warning_lamps">Рентгеновские предупреждающие лампы</Label>
                  <Input
                    id="xray_warning_lamps"
                    placeholder="Количество и напряжение"
                    value={formData.xray_warning_lamps}
                    onChange={(e) => setFormData({ ...formData, xray_warning_lamps: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="raised_floor">Фальшпол</Label>
                  <Input
                    id="raised_floor"
                    placeholder="Да/Нет и Глубина"
                    value={formData.raised_floor}
                    onChange={(e) => setFormData({ ...formData, raised_floor: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ceiling_drops">Опуски плит</Label>
                  <Input
                    id="ceiling_drops"
                    placeholder="Да/Нет и Глубина"
                    value={formData.ceiling_drops}
                    onChange={(e) => setFormData({ ...formData, ceiling_drops: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="precision_ac" className="flex items-center gap-2">
                    Прецизионный кондиционер
                    <Switch
                      id="precision_ac"
                      checked={formData.precision_ac}
                      onCheckedChange={(checked) => setFormData({ ...formData, precision_ac: checked })}
                    />
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medical_gas_o2">Медгазы (O2)</Label>
                  <Input
                    id="medical_gas_o2"
                    placeholder="Прямое подключение устройства"
                    value={formData.medical_gas_o2}
                    onChange={(e) => setFormData({ ...formData, medical_gas_o2: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medical_gas_ma4">Медгазы (MA4)</Label>
                  <Input
                    id="medical_gas_ma4"
                    placeholder="Прямое подключение устройства"
                    value={formData.medical_gas_ma4}
                    onChange={(e) => setFormData({ ...formData, medical_gas_ma4: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medical_gas_ma7">Медгазы (MA7)</Label>
                  <Input
                    id="medical_gas_ma7"
                    placeholder="Прямое подключение устройства"
                    value={formData.medical_gas_ma7}
                    onChange={(e) => setFormData({ ...formData, medical_gas_ma7: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medical_gas_n2o">Медгазы (N2O)</Label>
                  <Input
                    id="medical_gas_n2o"
                    placeholder="Прямое подключение устройства"
                    value={formData.medical_gas_n2o}
                    onChange={(e) => setFormData({ ...formData, medical_gas_n2o: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medical_gas_other">Медгазы (Другие)</Label>
                  <Input
                    id="medical_gas_other"
                    placeholder="Прямое подключение устройства"
                    value={formData.medical_gas_other}
                    onChange={(e) => setFormData({ ...formData, medical_gas_other: e.target.value })}
                  />
                </div>

                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="other_requirements">Прочие требования</Label>
                  <Textarea
                    id="other_requirements"
                    value={formData.other_requirements}
                    onChange={(e) => setFormData({ ...formData, other_requirements: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="border rounded-lg p-4 bg-accent/10">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" type="button">
                <span className="font-semibold">Закупочная информация (для админов и сотрудников)</span>
                <ChevronDown className="h-4 w-4 transition-transform" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purchase_price">Цена закупа</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    value={formData.purchase_price || ''}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price_updated_at">Дата обновления</Label>
                  <Input
                    id="price_updated_at"
                    type="date"
                    value={formData.price_updated_at ? formData.price_updated_at.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, price_updated_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="incoterms">Условия инкотермс</Label>
                  <Input
                    id="incoterms"
                    value={formData.incoterms}
                    onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supplier">Поставщик</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>

                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="supplier_status">Статус поставщика</Label>
                  <Select
                    value={formData.supplier_status}
                    onValueChange={(value) => setFormData({ ...formData, supplier_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Завод">Завод</SelectItem>
                      <SelectItem value="Представительство">Представительство</SelectItem>
                      <SelectItem value="Дилер">Дилер</SelectItem>
                      <SelectItem value="Перекуп">Перекуп</SelectItem>
                      <SelectItem value="Дистрибутор">Дистрибутор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 col-span-2">
                  <Label>Контакты поставщика</Label>
                  <div className="space-y-2">
                    {formData.supplier_contacts.map((contact, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">Контакт {idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newContacts = formData.supplier_contacts.filter((_, i) => i !== idx);
                              setFormData({ ...formData, supplier_contacts: newContacts });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Имя"
                          value={contact.name}
                          onChange={(e) => {
                            const newContacts = [...formData.supplier_contacts];
                            newContacts[idx] = { ...contact, name: e.target.value };
                            setFormData({ ...formData, supplier_contacts: newContacts });
                          }}
                        />
                        <Input
                          placeholder="Телефоны (через запятую)"
                          value={contact.phones.join(', ')}
                          onChange={(e) => {
                            const newContacts = [...formData.supplier_contacts];
                            newContacts[idx] = { ...contact, phones: e.target.value.split(',').map(p => p.trim()) };
                            setFormData({ ...formData, supplier_contacts: newContacts });
                          }}
                        />
                        <Input
                          placeholder="Email (через запятую)"
                          value={contact.emails.join(', ')}
                          onChange={(e) => {
                            const newContacts = [...formData.supplier_contacts];
                            newContacts[idx] = { ...contact, emails: e.target.value.split(',').map(e => e.trim()) };
                            setFormData({ ...formData, supplier_contacts: newContacts });
                          }}
                        />
                        <Input
                          placeholder="Город"
                          value={contact.city}
                          onChange={(e) => {
                            const newContacts = [...formData.supplier_contacts];
                            newContacts[idx] = { ...contact, city: e.target.value };
                            setFormData({ ...formData, supplier_contacts: newContacts });
                          }}
                        />
                        <Input
                          placeholder="Адрес"
                          value={contact.address}
                          onChange={(e) => {
                            const newContacts = [...formData.supplier_contacts];
                            newContacts[idx] = { ...contact, address: e.target.value };
                            setFormData({ ...formData, supplier_contacts: newContacts });
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          supplier_contacts: [...formData.supplier_contacts, { name: '', phones: [], emails: [], city: '', address: '' }]
                        });
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить контакт
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};