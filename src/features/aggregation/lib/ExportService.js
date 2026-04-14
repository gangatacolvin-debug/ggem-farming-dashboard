import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Professional Export Service for Aggregation Sessions
 */
export const ExportService = {
    /**
     * Generates a professional PDF report for an aggregation session
     */
    generateSessionPDF: (sessionData, submissions) => {
        try {
            console.log("Starting PDF generation for session:", sessionData.sessionId);
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();
            
            // Helper to find submission by type
            const getSub = (type) => submissions.find(s => s.checklistType === type);
            
            const setup = getSub('pre-aggregation-setup');
            const qc = getSub('aggregation-quality-control');
            const weighing = getSub('aggregation-weighing-recording');
            const warehouse = getSub('aggregation-warehouse-receiving');

            // --- Header Section ---
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            doc.text('AGGREGATION MARKET DAY REPORT', 14, 22);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${timestamp}`, 14, 30);
            doc.text(`Session ID: ${sessionData.sessionId}`, 14, 35);
            doc.text(`Hub: ${sessionData.hub?.toUpperCase()}`, 14, 40);

            // --- Summary Grid ---
            doc.setDrawColor(200);
            doc.line(14, 45, 196, 45);
            
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('PERFORMANCE SUMMARY', 14, 55);
            
            const totalGross = weighing?.['total-gross-amount'] || 0;
            const displayGross = typeof totalGross === 'number' ? totalGross.toLocaleString() : totalGross;

            const summaryData = [
                ['Expected Farmers', setup?.['expected-farmers'] || 'N/A', 'Total Weight Logged', `${weighing?.['total-weight-kg'] || 0} kg`],
                ['Actual Farmers', weighing?.['total-farmers-weighed'] || 0, 'Total Value (MWK)', `${displayGross}`],
                ['Warehouse Received', `${warehouse?.['total-weight-received-kg'] || 0} kg`, 'Bags Received', warehouse?.['total-bags-received'] || 0]
            ];

            doc.autoTable({
                startY: 60,
                head: [],
                body: summaryData,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', textColor: [100, 100, 100] },
                    2: { fontStyle: 'bold', textColor: [100, 100, 100] }
                }
            });

            // --- Team Section ---
            let finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.text('ON-SITE COORDINATION TEAM', 14, finalY);
            
            const teamData = [
                ['Coordinator', setup?.['hub-coordinator-name'] || '---', setup?.['hub-coordinator-present'] ? 'PRESENT' : 'ABSENT'],
                ['Security Lead', setup?.['security-lead-name'] || '---', setup?.['security-team-present'] ? 'PRESENT' : 'ABSENT'],
                ['Warehouse Lead', setup?.['warehouse-supervisor-name'] || '---', setup?.['warehouse-team-present'] ? 'PRESENT' : 'ABSENT'],
                ['Data Lead', setup?.['data-team-representative-name'] || '---', setup?.['data-team-present'] ? 'PRESENT' : 'ABSENT']
            ];

            doc.autoTable({
                startY: finalY + 5,
                head: [['Role', 'Name', 'Status']],
                body: teamData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 9 }
            });

            // --- Quality Control Section ---
            finalY = doc.lastAutoTable.finalY + 10;
            doc.text('QUALITY CONTROL SUMMARY', 14, finalY);
            
            const qcData = [
                ['Batches Rejected', qc?.['batches-rejected-count'] || 0],
                ['Batches Downgraded', qc?.['batches-downgraded-count'] || 0],
                ['Exceptions Reported', qc?.['quality-exceptions-details'] || 'None']
            ];

            doc.autoTable({
                startY: finalY + 5,
                body: qcData,
                theme: 'plain',
                styles: { fontSize: 9 },
                columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
            });

            // --- Weighing Logs (The Core Data Table) ---
            doc.addPage();
            doc.setFontSize(14);
            doc.text('DETAILED WEIGHING LOGS', 14, 20);
            
            const weighingLogs = weighing?.['farmer-weighing-logs'] || [];
            const weighingTableData = weighingLogs.map(log => [
                log.farmerName,
                log.clubGroupName,
                `${log.variety} / ${log.grade}`,
                `${log.weightKg} kg`,
                typeof log.grossAmount === 'number' ? log.grossAmount.toLocaleString() : log.grossAmount
            ]);

            doc.autoTable({
                startY: 30,
                head: [['Farmer Name', 'Club / Group', 'Quality', 'Weight', 'Amount (MWK)']],
                body: weighingTableData,
                theme: 'grid',
                headStyles: { fillColor: [52, 73, 94], textColor: 255 },
                styles: { fontSize: 8 },
                columnStyles: {
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                }
            });

            // Footnote
            finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Official GGEM Dashboard Export - Confidential Business Data', 14, finalY);

            doc.save(`GGEM_Aggregation_Report_${sessionData.sessionId}.pdf`);
            console.log("PDF generated successfully");
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Error generating PDF: " + error.message);
        }
    },

    /**
     * Generates a professional Excel workbook for an aggregation session
     */
    generateSessionExcel: (sessionData, submissions) => {
        try {
            const wb = XLSX.utils.book_new();

            // 1. Summary Sheet
            const summaryData = [
                ["GGEM AGGREGATION SESSION SUMMARY"],
                ["Session ID", sessionData.sessionId],
                ["Hub", sessionData.hub],
                ["Status", sessionData.status],
                ["Generated At", new Date().toLocaleString()],
                [],
                ["KEY METRICS"],
                ["Field", "Value"],
            ];

            // Find relevant submissions
            const weighing = submissions.find(s => s.checklistType === 'aggregation-weighing-recording');
            const setup = submissions.find(s => s.checklistType === 'pre-aggregation-setup');
            const warehouse = submissions.find(s => s.checklistType === 'aggregation-warehouse-receiving');
            const qc = submissions.find(s => s.checklistType === 'aggregation-quality-control');

            if (weighing) {
                summaryData.push(["Total Farmers Weighed", weighing['total-farmers-weighed'] || 0]);
                summaryData.push(["Total Weight (kg)", weighing['total-weight-kg'] || 0]);
                summaryData.push(["Total Value (MWK)", weighing['total-gross-amount'] || 0]);
            }
            if (warehouse) {
                summaryData.push(["Bags Received", warehouse['total-bags-received'] || 0]);
                summaryData.push(["Warehouse Weight (kg)", warehouse['total-weight-received-kg'] || 0]);
            }

            const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

            // 2. Weighing Logs Sheet
            if (weighing && weighing['farmer-weighing-logs']) {
                const weighingWS = XLSX.utils.json_to_sheet(weighing['farmer-weighing-logs']);
                XLSX.utils.book_append_sheet(wb, weighingWS, "Weighing Logs");
            }

            // 3. QC Table Sheet
            if (qc && qc['moisture-grading-logs']) {
                const qcWS = XLSX.utils.json_to_sheet(qc['moisture-grading-logs']);
                XLSX.utils.book_append_sheet(wb, qcWS, "Quality Grading");
            }

            XLSX.writeFile(wb, `GGEM_Session_${sessionData.sessionId}.xlsx`);
        } catch (error) {
            console.error("Excel generation failed:", error);
            alert("Error generating Excel: " + error.message);
        }
    }
};
