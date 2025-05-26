/**
 * DASHBOARD DE INTEGRIDAD DE DATOS
 * 
 * Componente que muestra el estado de salud del sistema de datos
 * y permite al usuario verificar y reparar problemas de integridad.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  Clock,
  TrendingUp
} from 'lucide-react';
import { checkSystemIntegrity, getIntegrityStats, IntegrityReport } from '@/lib/dataIntegrity';
import { useDataSync } from '@/hooks/useDataSync';

interface DataIntegrityDashboardProps {
  className?: string;
}

export function DataIntegrityDashboard({ className }: DataIntegrityDashboardProps) {
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const { isLoading: isSyncing, lastSync, syncError, forceSync, stats } = useDataSync();

  // Cargar reporte inicial
  useEffect(() => {
    loadIntegrityReport();
  }, []);

  // Actualizar reporte periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const currentReport = getIntegrityStats();
      setIntegrityReport(currentReport);
      setLastUpdate(new Date());
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  const loadIntegrityReport = async () => {
    setIsChecking(true);
    try {
      const report = await checkSystemIntegrity();
      setIntegrityReport(report);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando reporte de integridad:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualCheck = async () => {
    await loadIntegrityReport();
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Error en sincronización forzada:', error);
    }
  };

  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? CheckCircle : XCircle;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const calculateHealthPercentage = () => {
    if (!integrityReport) return 0;
    const { healthyKeys, totalKeys } = integrityReport.stats;
    return totalKeys > 0 ? Math.round((healthyKeys / totalKeys) * 100) : 100;
  };

  const formatLastCheck = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `Hace ${diffHours}h`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con estado general */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado del Sistema de Datos
            </CardTitle>
            <CardDescription>
              Verificación de integridad y sincronización
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualCheck}
              disabled={isChecking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={isSyncing}
            >
              <Database className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Salud general */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(
                  getHealthIcon(integrityReport?.isHealthy ?? true),
                  { 
                    className: `h-5 w-5 ${getHealthColor(integrityReport?.isHealthy ?? true)}` 
                  }
                )}
                <span className="font-medium">
                  {integrityReport?.isHealthy ? 'Sistema Saludable' : 'Problemas Detectados'}
                </span>
              </div>
              <Badge variant={integrityReport?.isHealthy ? 'default' : 'destructive'}>
                {calculateHealthPercentage()}% Integridad
              </Badge>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-2">
              <Progress value={calculateHealthPercentage()} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {integrityReport?.stats.healthyKeys || 0} de {integrityReport?.stats.totalKeys || 0} elementos verificados
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatLastCheck(lastUpdate)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Saludables</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrityReport?.stats.healthyKeys || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Corruptos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {integrityReport?.stats.corruptedKeys || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sincronización</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastSync ? formatLastCheck(lastSync) : 'Nunca'}
            </div>
            {syncError && (
              <div className="text-xs text-red-600 mt-1">
                Error: {syncError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Problemas detectados */}
      {integrityReport?.issues && integrityReport.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Problemas Detectados ({integrityReport.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrityReport.issues.slice(0, 5).map((issue, index) => (
                <Alert key={index} className="border-l-4">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{issue.key}</div>
                        <div className="text-sm text-muted-foreground">
                          {issue.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        {issue.canAutoFix && (
                          <Badge variant="outline" className="text-green-600">
                            Auto-reparable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              
              {integrityReport.issues.length > 5 && (
                <div className="text-sm text-muted-foreground text-center pt-2">
                  Y {integrityReport.issues.length - 5} problemas más...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de sincronización */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Autenticado:</span>
              <Badge variant={stats.sync.isAuthenticated ? 'default' : 'secondary'}>
                {stats.sync.isAuthenticated ? 'Sí' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Conflictos resueltos:</span>
              <span className="font-medium">{stats.sync.conflictsResolved}</span>
            </div>
            <div className="flex justify-between">
              <span>Escrituras pendientes:</span>
              <span className="font-medium">{stats.sync.pendingWrites}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}