export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bitacora_camiones: {
        Row: {
          activo: boolean
          id: string
          numero: number
          placas: string | null
        }
        Insert: {
          activo?: boolean
          id?: string
          numero: number
          placas?: string | null
        }
        Update: {
          activo?: boolean
          id?: string
          numero?: number
          placas?: string | null
        }
        Relationships: []
      }
      bitacora_casetas: {
        Row: {
          id: string
          monto: number
          numero: number
          viaje_id: string
        }
        Insert: {
          id?: string
          monto?: number
          numero: number
          viaje_id: string
        }
        Update: {
          id?: string
          monto?: number
          numero?: number
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_casetas_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "bitacora_viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_componentes: {
        Row: {
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          id?: string
          nombre: string
          orden: number
        }
        Update: {
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      bitacora_config: {
        Row: {
          clave: string
          descripcion: string | null
          valor: number
        }
        Insert: {
          clave: string
          descripcion?: string | null
          valor: number
        }
        Update: {
          clave?: string
          descripcion?: string | null
          valor?: number
        }
        Relationships: []
      }
      bitacora_estados: {
        Row: {
          clave: string
          id: string
          nombre: string
        }
        Insert: {
          clave: string
          id?: string
          nombre: string
        }
        Update: {
          clave?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      bitacora_fletes: {
        Row: {
          descripcion: string | null
          id: string
          monto: number
          viaje_id: string
        }
        Insert: {
          descripcion?: string | null
          id?: string
          monto?: number
          viaje_id: string
        }
        Update: {
          descripcion?: string | null
          id?: string
          monto?: number
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_fletes_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "bitacora_viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_gastos_extra: {
        Row: {
          concepto: string
          id: string
          monto: number
          viaje_id: string
        }
        Insert: {
          concepto: string
          id?: string
          monto?: number
          viaje_id: string
        }
        Update: {
          concepto?: string
          id?: string
          monto?: number
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_gastos_extra_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "bitacora_viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_inventario_unidad: {
        Row: {
          componente: string
          estado: string
          id: string
          viaje_id: string
        }
        Insert: {
          componente: string
          estado?: string
          id?: string
          viaje_id: string
        }
        Update: {
          componente?: string
          estado?: string
          id?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_inventario_unidad_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "bitacora_viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_pesos: {
        Row: {
          categoria: string
          comision_porcentaje: number
          id: string
          orden: number
        }
        Insert: {
          categoria: string
          comision_porcentaje: number
          id?: string
          orden: number
        }
        Update: {
          categoria?: string
          comision_porcentaje?: number
          id?: string
          orden?: number
        }
        Relationships: []
      }
      bitacora_recargas: {
        Row: {
          es_relleno_final: boolean
          id: string
          litros: number
          lugar: string | null
          monto: number
          orden: number
          viaje_id: string
        }
        Insert: {
          es_relleno_final?: boolean
          id?: string
          litros?: number
          lugar?: string | null
          monto?: number
          orden?: number
          viaje_id: string
        }
        Update: {
          es_relleno_final?: boolean
          id?: string
          litros?: number
          lugar?: string | null
          monto?: number
          orden?: number
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_recargas_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "bitacora_viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_rendimientos: {
        Row: {
          id: string
          km_por_litro: number
          peso_categoria: string
          tipo_viaje: string
        }
        Insert: {
          id?: string
          km_por_litro: number
          peso_categoria: string
          tipo_viaje: string
        }
        Update: {
          id?: string
          km_por_litro?: number
          peso_categoria?: string
          tipo_viaje?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_rendimientos_peso_categoria_fkey"
            columns: ["peso_categoria"]
            isOneToOne: false
            referencedRelation: "bitacora_pesos"
            referencedColumns: ["categoria"]
          },
        ]
      }
      bitacora_viajes: {
        Row: {
          ajuste_rendimiento: number
          balance_efectivo: number
          camion_id: string
          comision_monto: number
          comision_porcentaje: number | null
          creado_en: string
          creado_por: string
          destino_estado: string | null
          efectivo_gastado: number
          empresa_carga: string | null
          estatus: string
          fecha: string
          folio: number
          gastos_depositados: number
          id: string
          km_llegada: number
          km_recorridos: number
          km_salida: number
          liquidado_en: string | null
          litros_devueltos: number
          litros_teoricos: number
          observaciones: string | null
          operador_id: string
          peso_categoria: string
          placas: string | null
          precio_litro_ahorro: number | null
          precio_penalizacion: number | null
          rendimiento_aplicado: number | null
          rendimiento_real: number
          sueldo_final: number
          tipo_combustible: string
          tipo_viaje: string
          total_casetas: number
          total_combustible: number
          total_fletes: number
          total_gastos_extra: number
          total_litros: number
        }
        Insert: {
          ajuste_rendimiento?: number
          balance_efectivo?: number
          camion_id: string
          comision_monto?: number
          comision_porcentaje?: number | null
          creado_en?: string
          creado_por: string
          destino_estado?: string | null
          efectivo_gastado?: number
          empresa_carga?: string | null
          estatus?: string
          fecha?: string
          folio?: number
          gastos_depositados?: number
          id?: string
          km_llegada?: number
          km_recorridos?: number
          km_salida?: number
          liquidado_en?: string | null
          litros_devueltos?: number
          litros_teoricos?: number
          observaciones?: string | null
          operador_id: string
          peso_categoria: string
          placas?: string | null
          precio_litro_ahorro?: number | null
          precio_penalizacion?: number | null
          rendimiento_aplicado?: number | null
          rendimiento_real?: number
          sueldo_final?: number
          tipo_combustible: string
          tipo_viaje: string
          total_casetas?: number
          total_combustible?: number
          total_fletes?: number
          total_gastos_extra?: number
          total_litros?: number
        }
        Update: {
          ajuste_rendimiento?: number
          balance_efectivo?: number
          camion_id?: string
          comision_monto?: number
          comision_porcentaje?: number | null
          creado_en?: string
          creado_por?: string
          destino_estado?: string | null
          efectivo_gastado?: number
          empresa_carga?: string | null
          estatus?: string
          fecha?: string
          folio?: number
          gastos_depositados?: number
          id?: string
          km_llegada?: number
          km_recorridos?: number
          km_salida?: number
          liquidado_en?: string | null
          litros_devueltos?: number
          litros_teoricos?: number
          observaciones?: string | null
          operador_id?: string
          peso_categoria?: string
          placas?: string | null
          precio_litro_ahorro?: number | null
          precio_penalizacion?: number | null
          rendimiento_aplicado?: number | null
          rendimiento_real?: number
          sueldo_final?: number
          tipo_combustible?: string
          tipo_viaje?: string
          total_casetas?: number
          total_combustible?: number
          total_fletes?: number
          total_gastos_extra?: number
          total_litros?: number
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_viajes_camion_id_fkey"
            columns: ["camion_id"]
            isOneToOne: false
            referencedRelation: "bitacora_camiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_viajes_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_viajes_destino_estado_fkey"
            columns: ["destino_estado"]
            isOneToOne: false
            referencedRelation: "bitacora_estados"
            referencedColumns: ["nombre"]
          },
          {
            foreignKeyName: "bitacora_viajes_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_viajes_peso_categoria_fkey"
            columns: ["peso_categoria"]
            isOneToOne: false
            referencedRelation: "bitacora_pesos"
            referencedColumns: ["categoria"]
          },
        ]
      }
      inventario_movimientos: {
        Row: {
          cantidad: number
          creado_en: string
          id: string
          marca_vehiculo: string | null
          motivo: string | null
          observaciones: string | null
          producto_id: string
          responsable_id: string
          tipo_movimiento: string
        }
        Insert: {
          cantidad: number
          creado_en?: string
          id?: string
          marca_vehiculo?: string | null
          motivo?: string | null
          observaciones?: string | null
          producto_id: string
          responsable_id: string
          tipo_movimiento: string
        }
        Update: {
          cantidad?: number
          creado_en?: string
          id?: string
          marca_vehiculo?: string | null
          motivo?: string | null
          observaciones?: string | null
          producto_id?: string
          responsable_id?: string
          tipo_movimiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_movimientos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_movimientos_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_productos: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo_interno: string
          creado_en: string
          estado: string
          id: string
          marca_vehiculo: string
          nombre: string
          stock_actual: number
          stock_inicial: number
          stock_minimo: number
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo_interno: string
          creado_en?: string
          estado?: string
          id?: string
          marca_vehiculo: string
          nombre: string
          stock_actual?: number
          stock_inicial?: number
          stock_minimo?: number
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo_interno?: string
          creado_en?: string
          estado?: string
          id?: string
          marca_vehiculo?: string
          nombre?: string
          stock_actual?: number
          stock_inicial?: number
          stock_minimo?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_liquidacion: {
        Args: {
          p_comision_porcentaje: number
          p_gastos_depositados: number
          p_km_llegada: number
          p_km_salida: number
          p_precio_litro_ahorro: number
          p_precio_penalizacion: number
          p_rendimiento_aplicado: number
          p_total_casetas: number
          p_total_fletes: number
          p_total_gastos_extra: number
          p_total_litros: number
        }
        Returns: {
          ajuste_rendimiento: number
          balance_efectivo: number
          comision_monto: number
          efectivo_gastado: number
          km_recorridos: number
          litros_devueltos: number
          litros_teoricos: number
          rendimiento_real: number
          sueldo_final: number
        }[]
      }
      guardar_viaje: { Args: { p_viaje: Json }; Returns: string }
      obtener_parametros_liquidacion: {
        Args: {
          p_peso_categoria: string
          p_tipo_combustible: string
          p_tipo_viaje: string
        }
        Returns: {
          comision_porcentaje: number
          precio_litro_ahorro: number
          precio_penalizacion: number
          rendimiento_aplicado: number
        }[]
      }
    }
    Enums: {
      app_role: "operador" | "gerencia" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["operador", "gerencia", "admin"],
    },
  },
} as const
