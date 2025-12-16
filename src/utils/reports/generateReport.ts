import jsPDF from 'jspdf';
import { supabase } from '../supabase/client';

interface ReportData {
  totalRentals: number;
  rentedDresses: number;
  customersServed: number;
  activeRentals: number;
  pendingReturns: number;
  cancellations: number;
  bestSellingDress: { name: string; count: number };
  rentalsByStatus: { active: number; completed: number; cancelled: number };
  recentRentals: Array<{
    client: string;
    dress: string;
    date: string;
    status: string;
  }>;
}

export const generateDailyReport = async (): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Cargar rentas del día
    const { data: orders, error: ordersError } = await supabase
      .from('Orders')
      .select(`
        *,
        Products:product_id (name),
        Customers:customer_id (name, last_name)
      `)
      .gte('created_at', todayStr)
      .lt('created_at', tomorrowStr)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw new Error('Error al cargar rentas');
    }

    // Cargar todas las rentas activas
    const { data: activeOrders } = await supabase
      .from('Orders')
      .select('*')
      .in('status', ['active', 'pending']);

    // Cargar devoluciones pendientes
    const { data: pendingReturns } = await supabase
      .from('Orders')
      .select('*')
      .lte('due_date', todayStr)
      .is('return_date', null)
      .in('status', ['active']);

    // Cargar cancelaciones del día
    const { data: cancellations } = await supabase
      .from('Orders')
      .select('*')
      .gte('created_at', todayStr)
      .lt('created_at', tomorrowStr)
      .in('status', ['cancelled', 'canceled']);

    // Calcular vestido más rentado
    const dressCounts: { [key: number]: number } = {};
    orders?.forEach(order => {
      if (order.product_id) {
        dressCounts[order.product_id] = (dressCounts[order.product_id] || 0) + 1;
      }
    });

    const bestSelling = Object.entries(dressCounts).sort((a, b) => b[1] - a[1])[0];
    let bestSellingDress = { name: 'N/A', count: 0 };
    if (bestSelling) {
      const { data: product } = await supabase
        .from('Products')
        .select('name')
        .eq('id', parseInt(bestSelling[0]))
        .single();
      if (product) {
        bestSellingDress = { name: product.name, count: bestSelling[1] };
      }
    }

    // Obtener clientes únicos atendidos
    const uniqueCustomers = new Set(orders?.map(order => order.customer_id).filter(Boolean) || []);

    // Preparar datos del reporte
    const reportData: ReportData = {
      totalRentals: orders?.length || 0,
      rentedDresses: new Set(orders?.map(order => order.product_id).filter(Boolean) || []).size,
      customersServed: uniqueCustomers.size,
      activeRentals: activeOrders?.length || 0,
      pendingReturns: pendingReturns?.length || 0,
      cancellations: cancellations?.length || 0,
      bestSellingDress,
      rentalsByStatus: {
        active: orders?.filter(o => o.status === 'active' || o.status === 'pending').length || 0,
        completed: orders?.filter(o => o.status === 'completed').length || 0,
        cancelled: cancellations?.length || 0,
      },
      recentRentals: (orders || []).slice(0, 10).map(order => ({
        client: order.Customers
          ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
          : 'Cliente desconocido',
        dress: order.Products?.name || 'Vestido desconocido',
        date: new Date(order.created_at).toLocaleDateString('es-ES'),
        status: order.status === 'active' ? 'Activo' : order.status === 'completed' ? 'Completado' : 'Cancelado',
      })),
    };

    // Generar PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Título con nombre de la empresa
    doc.setFontSize(24);
    doc.setTextColor(124, 16, 124);
    doc.text('Magnifique Vestidos', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Renta de vestidos', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    doc.setFontSize(20);
    doc.setTextColor(124, 16, 124);
    doc.text('Reporte Diario de Rentas', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Fecha
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${today.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, yPos);
    yPos += 15;

    // Resumen
    doc.setFontSize(16);
    doc.setTextColor(124, 16, 124);
    doc.text('Resumen del Día', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Rentas: ${reportData.totalRentals}`, margin, yPos);
    yPos += 7;
    doc.text(`Vestidos Rentados: ${reportData.rentedDresses}`, margin, yPos);
    yPos += 7;
    doc.text(`Clientes Atendidos: ${reportData.customersServed}`, margin, yPos);
    yPos += 7;
    doc.text(`Rentas Activas: ${reportData.activeRentals}`, margin, yPos);
    yPos += 7;
    doc.text(`Devoluciones Pendientes: ${reportData.pendingReturns}`, margin, yPos);
    yPos += 7;
    doc.text(`Cancelaciones: ${reportData.cancellations}`, margin, yPos);
    yPos += 10;

    // Vestido más rentado
    doc.setFontSize(16);
    doc.setTextColor(124, 16, 124);
    doc.text('Vestido Más Rentado', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${reportData.bestSellingDress.name}: ${reportData.bestSellingDress.count} renta(s)`, margin, yPos);
    yPos += 15;

    // Rentas por estado
    doc.setFontSize(16);
    doc.setTextColor(124, 16, 124);
    doc.text('Rentas por Estado', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Activas: ${reportData.rentalsByStatus.active}`, margin, yPos);
    yPos += 7;
    doc.text(`Completadas: ${reportData.rentalsByStatus.completed}`, margin, yPos);
    yPos += 7;
    doc.text(`Canceladas: ${reportData.rentalsByStatus.cancelled}`, margin, yPos);
    yPos += 15;

    // Rentas recientes
    if (reportData.recentRentals.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(124, 16, 124);
      doc.text('Rentas Recientes', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      reportData.recentRentals.forEach((rental, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(`${index + 1}. ${rental.client} - ${rental.dress}`, margin, yPos);
        yPos += 6;
        doc.text(`   Fecha: ${rental.date} | Estado: ${rental.status}`, margin + 5, yPos);
        yPos += 8;
      });
    }

    // Guardar PDF
    const fileName = `reporte_${todayStr}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};


