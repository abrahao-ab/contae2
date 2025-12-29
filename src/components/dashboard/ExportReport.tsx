import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeDialog } from '@/components/upgrade/UpgradeDialog';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ExportReportProps {
  transactions: Transaction[];
  categories: Category[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  stats: {
    income: number;
    expense: number;
    balance: number;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const captureChart = async (elementId: string): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Error capturing chart ${elementId}:`, error);
    return null;
  }
};

export function ExportReport({ transactions, categories, dateRange, stats }: ExportReportProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { canAccess, isFree } = usePlanLimits();

  const getPeriodString = () => {
    if (!dateRange.from || !dateRange.to) return 'Período não definido';
    return `${format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    return categories.find((c) => c.id === categoryId)?.name || 'Sem categoria';
  };

  const exportToExcel = async () => {
    setExporting('excel');
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['RELATÓRIO FINANCEIRO'],
        [''],
        ['Período:', getPeriodString()],
        ['Data de geração:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
        [''],
        ['RESUMO'],
        ['Total de Receitas:', formatCurrency(stats.income)],
        ['Total de Despesas:', formatCurrency(stats.expense)],
        ['Saldo do Período:', formatCurrency(stats.balance)],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      // Income transactions sheet
      const incomeTransactions = transactions.filter((t) => t.type === 'income');
      const incomeData = [
        ['RECEITAS'],
        [''],
        ['Data', 'Descrição', 'Categoria', 'Valor'],
        ...incomeTransactions.map((t) => [
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.description || '-',
          getCategoryName(t.category_id),
          formatCurrency(t.amount),
        ]),
        [''],
        ['TOTAL', '', '', formatCurrency(stats.income)],
      ];
      const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
      XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Receitas');

      // Expense transactions sheet
      const expenseTransactions = transactions.filter((t) => t.type === 'expense');
      const expenseData = [
        ['DESPESAS'],
        [''],
        ['Data', 'Descrição', 'Categoria', 'Valor'],
        ...expenseTransactions.map((t) => [
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.description || '-',
          getCategoryName(t.category_id),
          formatCurrency(t.amount),
        ]),
        [''],
        ['TOTAL', '', '', formatCurrency(stats.expense)],
      ];
      const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Despesas');

      // Category summary sheet
      const categoryTotals = transactions.reduce((acc, t) => {
        const catName = getCategoryName(t.category_id);
        if (!acc[catName]) {
          acc[catName] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          acc[catName].income += t.amount;
        } else {
          acc[catName].expense += t.amount;
        }
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      const categoryData = [
        ['RESUMO POR CATEGORIA'],
        [''],
        ['Categoria', 'Receitas', 'Despesas', 'Saldo'],
        ...Object.entries(categoryTotals).map(([name, totals]) => [
          name,
          formatCurrency(totals.income),
          formatCurrency(totals.expense),
          formatCurrency(totals.income - totals.expense),
        ]),
      ];
      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoria');

      // Capture charts as images
      const incomeExpenseChartImg = await captureChart('income-expense-chart');
      const categoryChartImg = await captureChart('category-chart-expense');

      // Charts sheet with images (Excel limitation: images are added as comments/notes)
      // For a better experience, we'll add a note explaining charts are in PDF
      const chartsData = [
        ['GRÁFICOS'],
        [''],
        ['Os gráficos visuais estão disponíveis na versão PDF do relatório.'],
        [''],
        ['DADOS DO GRÁFICO - RECEITAS vs DESPESAS'],
        [''],
      ];

      // Group transactions by date for chart data
      const dateGrouped = transactions.reduce((acc, t) => {
        if (!acc[t.date]) {
          acc[t.date] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          acc[t.date].income += t.amount;
        } else {
          acc[t.date].expense += t.amount;
        }
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      chartsData.push(['Data', 'Receitas', 'Despesas']);
      Object.entries(dateGrouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, values]) => {
          chartsData.push([
            format(new Date(date), 'dd/MM/yyyy'),
            formatCurrency(values.income),
            formatCurrency(values.expense),
          ]);
        });

      const chartsSheet = XLSX.utils.aoa_to_sheet(chartsData);
      XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Gráficos');

      // Generate and download
      const fileName = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'Sucesso!',
        description: 'Relatório Excel baixado com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório Excel.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting('pdf');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Helper function to add text
      const addText = (text: string, size: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(...color);
        pdf.text(text, margin, yPosition);
        yPosition += size * 0.5;
      };

      const addLine = () => {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      };

      // Capture charts
      const incomeExpenseChartImg = await captureChart('income-expense-chart');
      const categoryChartImg = await captureChart('category-chart-expense');

      // Title
      addText('RELATÓRIO FINANCEIRO', 18, true, [59, 130, 246]);
      yPosition += 5;
      addLine();

      // Period
      addText(`Período: ${getPeriodString()}`, 10);
      addText(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 10);
      yPosition += 10;

      // Summary box
      pdf.setFillColor(240, 249, 255);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 3, 3, 'F');
      yPosition += 10;
      
      addText('RESUMO DO PERÍODO', 12, true);
      yPosition += 5;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Receitas: ${formatCurrency(stats.income)}`, margin + 5, yPosition);
      
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Despesas: ${formatCurrency(stats.expense)}`, pageWidth / 2, yPosition);
      yPosition += 7;
      
      pdf.setTextColor(59, 130, 246);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Saldo: ${formatCurrency(stats.balance)}`, margin + 5, yPosition);
      yPosition += 25;

      // Charts section
      if (incomeExpenseChartImg || categoryChartImg) {
        addText('GRÁFICOS', 14, true, [59, 130, 246]);
        yPosition += 10;

        const chartWidth = (pageWidth - 2 * margin - 10) / 2;
        const chartHeight = 60;

        if (incomeExpenseChartImg) {
          pdf.addImage(incomeExpenseChartImg, 'PNG', margin, yPosition, chartWidth, chartHeight);
        }

        if (categoryChartImg) {
          pdf.addImage(categoryChartImg, 'PNG', margin + chartWidth + 10, yPosition, chartWidth, chartHeight);
        }

        yPosition += chartHeight + 15;
      }

      // Income section
      const incomeTransactions = transactions.filter((t) => t.type === 'income');
      if (incomeTransactions.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }

        addText('RECEITAS', 14, true, [34, 197, 94]);
        yPosition += 5;
        
        // Table header
        pdf.setFillColor(34, 197, 94);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Data', margin + 3, yPosition + 5);
        pdf.text('Descrição', margin + 30, yPosition + 5);
        pdf.text('Categoria', margin + 90, yPosition + 5);
        pdf.text('Valor', margin + 140, yPosition + 5);
        yPosition += 10;

        // Table rows
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        incomeTransactions.slice(0, 15).forEach((t, i) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          if (i % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
          }
          pdf.text(format(new Date(t.date), 'dd/MM/yyyy'), margin + 3, yPosition);
          pdf.text((t.description || '-').substring(0, 25), margin + 30, yPosition);
          pdf.text(getCategoryName(t.category_id).substring(0, 15), margin + 90, yPosition);
          pdf.text(formatCurrency(t.amount), margin + 140, yPosition);
          yPosition += 7;
        });
        
        if (incomeTransactions.length > 15) {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          pdf.text(`... e mais ${incomeTransactions.length - 15} transações`, margin + 3, yPosition);
          yPosition += 7;
        }
        yPosition += 10;
      }

      // Expense section
      const expenseTransactions = transactions.filter((t) => t.type === 'expense');
      if (expenseTransactions.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        
        addText('DESPESAS', 14, true, [239, 68, 68]);
        yPosition += 5;
        
        // Table header
        pdf.setFillColor(239, 68, 68);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Data', margin + 3, yPosition + 5);
        pdf.text('Descrição', margin + 30, yPosition + 5);
        pdf.text('Categoria', margin + 90, yPosition + 5);
        pdf.text('Valor', margin + 140, yPosition + 5);
        yPosition += 10;

        // Table rows
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        expenseTransactions.slice(0, 15).forEach((t, i) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          if (i % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
          }
          pdf.text(format(new Date(t.date), 'dd/MM/yyyy'), margin + 3, yPosition);
          pdf.text((t.description || '-').substring(0, 25), margin + 30, yPosition);
          pdf.text(getCategoryName(t.category_id).substring(0, 15), margin + 90, yPosition);
          pdf.text(formatCurrency(t.amount), margin + 140, yPosition);
          yPosition += 7;
        });
        
        if (expenseTransactions.length > 15) {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          pdf.text(`... e mais ${expenseTransactions.length - 15} transações`, margin + 3, yPosition);
          yPosition += 7;
        }
        yPosition += 10;
      }

      // Category chart (as text summary)
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      addText('RESUMO POR CATEGORIA', 14, true, [59, 130, 246]);
      yPosition += 5;

      const categoryTotals = transactions.reduce((acc, t) => {
        const catName = getCategoryName(t.category_id);
        if (!acc[catName]) {
          acc[catName] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          acc[catName].income += t.amount;
        } else {
          acc[catName].expense += t.amount;
        }
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      pdf.setFillColor(59, 130, 246);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Categoria', margin + 3, yPosition + 5);
      pdf.text('Receitas', margin + 60, yPosition + 5);
      pdf.text('Despesas', margin + 100, yPosition + 5);
      pdf.text('Saldo', margin + 140, yPosition + 5);
      yPosition += 10;

      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      Object.entries(categoryTotals).forEach(([name, totals], i) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        if (i % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
        }
        pdf.text(name.substring(0, 20), margin + 3, yPosition);
        pdf.setTextColor(34, 197, 94);
        pdf.text(formatCurrency(totals.income), margin + 60, yPosition);
        pdf.setTextColor(239, 68, 68);
        pdf.text(formatCurrency(totals.expense), margin + 100, yPosition);
        pdf.setTextColor(0, 0, 0);
        pdf.text(formatCurrency(totals.income - totals.expense), margin + 140, yPosition);
        yPosition += 7;
      });

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${pageCount} - Gerado automaticamente`,
          pageWidth / 2,
          285,
          { align: 'center' }
        );
      }

      // Save
      const fileName = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Sucesso!',
        description: 'Relatório PDF baixado com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório PDF.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const canExport = canAccess('can_export');

  const handleExportClick = (exportFn: () => Promise<void>) => {
    if (!canExport) {
      setShowUpgradeDialog(true);
      return;
    }
    exportFn();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFree() ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar Relatório
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleExportClick(exportToExcel)}
            disabled={exporting !== null}
            className="gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Baixar Excel (.xlsx)
            {!canExport && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExportClick(exportToPDF)}
            disabled={exporting !== null}
            className="gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-red-600" />
            Baixar PDF
            {!canExport && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpgradeDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        feature="Exportação de Relatórios"
        featureDescription="Exporte seus relatórios financeiros em Excel e PDF para análise detalhada."
        requiredPlan="paid"
      />
    </>
  );
}
