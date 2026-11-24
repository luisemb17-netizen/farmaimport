// ============================================================================
// Estructura de datos de una factura ya armada.
// La usan la plantilla HTML, el PDF y la vista previa: así todos muestran
// exactamente lo mismo.
// ============================================================================

export interface ItemFactura {
  cantidad: number;
  codigo: string;
  descripcion: string;
  precioUnitario: number;
  monto: number;
  exento: boolean;
}

export interface DatosFactura {
  emisor: {
    razonSocial: string;
    rif: string;
    direccionFiscal: string;
    telefono: string | null;
    logoUrl: string | null;
  };
  comprobante: {
    numeroFactura: string;
    numeroControl: string;
    fecha: string;
    hora: string;
    estado: "completada" | "anulada";
  };
  cliente: {
    nombre: string;
    rif: string;
    direccion: string | null;
  };
  items: ItemFactura[];
  totales: {
    baseImponible: number;
    exento: number;
    porcentajeIva: number;
    iva: number;
    total: number;
  };
  pago: {
    metodo: string;
    vendedor: string;
    observaciones: string | null;
  };
  anulacion: {
    motivo: string;
    fecha: string;
  } | null;
}
