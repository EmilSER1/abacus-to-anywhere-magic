import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDepartments } from "@/hooks/useDepartments";
import { useDepartmentMappingsWithDetails, useUpdateDepartmentMappingWithIds } from "@/hooks/useDepartmentMappingsById";
import { toast } from "sonner";

const DepartmentIdTestPage = () => {
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: mappings, isLoading: mappingsLoading } = useDepartmentMappingsWithDetails();
  const updateMappingsMutation = useUpdateDepartmentMappingWithIds();

  const handleUpdateMappings = () => {
    updateMappingsMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`Обновлено ${result.updated} связей отделений`);
      },
      onError: (error) => {
        toast.error(`Ошибка обновления: ${error.message}`);
      }
    });
  };

  if (departmentsLoading || mappingsLoading) {
    return <div className="p-8">Загрузка...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Тест ID связывания отделений</h1>
        <Button 
          onClick={handleUpdateMappings}
          disabled={updateMappingsMutation.isPending}
          className="gap-2"
        >
          {updateMappingsMutation.isPending ? 'Обновляем...' : 'Обновить ID связи'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Справочные отделения */}
        <Card>
          <CardHeader>
            <CardTitle>Справочные отделения ({departments?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {departments?.map(dept => (
                <div key={dept.id} className="p-2 border rounded text-sm">
                  <div className="font-medium">{dept.name}</div>
                  <div className="text-xs text-muted-foreground">ID: {dept.id}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Связи отделений */}
        <Card>
          <CardHeader>
            <CardTitle>Связи отделений ({mappings?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mappings?.map(mapping => (
                <div key={mapping.id} className="p-3 border rounded text-sm">
                  <div className="font-medium mb-2">
                    {mapping.turar_department} → {mapping.projector_department}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {mapping.turar_department_id ? (
                      <Badge variant="secondary" className="text-xs">
                        Turar ID: {mapping.turar_department_id.slice(0, 8)}...
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Без Turar ID
                      </Badge>
                    )}
                    
                    {mapping.projector_department_id ? (
                      <Badge variant="secondary" className="text-xs">
                        Proj ID: {mapping.projector_department_id.slice(0, 8)}...
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Без Proj ID
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{departments?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Всего отделений</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{mappings?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Всего связей</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {mappings?.filter(m => m.turar_department_id && m.projector_department_id).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Связи с ID</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentIdTestPage;