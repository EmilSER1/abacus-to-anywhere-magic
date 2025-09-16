import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, Check, AlertCircle } from 'lucide-react';

interface RoomConnectionIndicatorProps {
  connectedCount: number;
  totalAvailable?: number;
  onClick: () => void;
  variant?: 'turar' | 'projector';
}

export default function RoomConnectionIndicator({
  connectedCount,
  totalAvailable,
  onClick,
  variant = 'turar'
}: RoomConnectionIndicatorProps) {
  const hasConnections = connectedCount > 0;
  const hasAvailable = totalAvailable != null && totalAvailable > 0;
  
  console.log('🔗 RoomConnectionIndicator render:', {
    connectedCount,
    totalAvailable,
    hasConnections,
    hasAvailable,
    isDisabled: !hasAvailable
  });
  
  const getStatusColor = () => {
    if (!hasAvailable) return 'secondary';
    if (!hasConnections) return 'destructive';
    if (connectedCount === totalAvailable) return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (!hasAvailable) return <AlertCircle className="h-3 w-3" />;
    if (!hasConnections) return <Link2 className="h-3 w-3" />;
    return <Check className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (!hasAvailable) return 'Нет связанных отделений';
    if (!hasConnections) return 'Не связан';
    if (totalAvailable && connectedCount === totalAvailable) return 'Все связаны';
    return `Связано: ${connectedCount}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        {getStatusText()}
        {totalAvailable && connectedCount > 0 && connectedCount < totalAvailable && (
          <span className="text-xs">/ {totalAvailable}</span>
        )}
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={!hasAvailable}
        className="h-6 px-2 text-xs"
      >
        <Link2 className="h-3 w-3 mr-1" />
        {hasConnections ? 'Управление связями' : 'Связать кабинеты'}
      </Button>
    </div>
  );
}