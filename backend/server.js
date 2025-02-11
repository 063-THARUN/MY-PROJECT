const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const PDFDocument = require('pdfkit-table');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

const uploadDir = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// At the top of your file, add the path
const logoPath = path.join(__dirname, 'assets', 'vcet-logo.png');

// At the top of your file, after requiring modules
const fontPath = path.join(__dirname, 'assets', 'times-new-roman.ttf');

// Function to get student grades from Excel
async function getStudentGradesFromExcel(excelFilePath, registerNumber) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelFilePath);
        const worksheet = workbook.worksheets[0];

        const getCellValue = (cell) => {
            if (!cell || !cell.value) return '';
            if (cell.value.richText) {
                return cell.value.richText.map(rt => rt.text).join('');
            }
            if (cell.value.text) {
                return cell.value.text;
            }
            if (typeof cell.value === 'object') {
                return cell.value.result || '';
            }
            return cell.value.toString().trim();
        };

        // Read headers from first row
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers.push(getCellValue(cell));
        });

        let studentData = null;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const currentRegisterNumber = getCellValue(row.getCell(1));
            
            if (currentRegisterNumber === registerNumber.trim()) {
                // Initialize student data with basic info
                studentData = {
                    "Register No.": currentRegisterNumber,
                    "Name of the student": getCellValue(row.getCell(2)),
                    subjects: {}
                };

                // Dynamically add subjects starting from column 3
                for (let i = 3; i <= headers.length; i++) {
                    const subjectCode = headers[i - 1];
                    studentData.subjects[subjectCode] = getCellValue(row.getCell(i));
                }
            }
        });

        return studentData;
    } catch (error) {
        console.error("Error reading Excel file:", error);
        throw new Error("Failed to read Excel file: " + error.message);
    }
}

// Route to upload Excel file
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.worksheets[0];

        const pdfPath = path.join(uploadDir, 'converted.pdf');
        const doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4', 
            layout: 'landscape',
            bufferPages: true
        });
        
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Add header
        doc.fontSize(20).text('Student Grade Report', { align: 'center' });
        doc.moveDown();
        
        // Add college name and department
        doc.fontSize(14).text('Velammal college of engineering and technology', { align: 'center' });
        doc.fontSize(12).text('Department of Computer Science and Engineering', { align: 'center' });
        doc.moveDown();

        // Read headers
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers.push(getCellValue(cell));
        });

        // Prepare table data
        const tableData = {
            headers: headers,
            rows: []
        };

        // Add data rows
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const rowData = [];
            
            for (let colNumber = 1; colNumber <= headers.length; colNumber++) {
                const cell = row.getCell(colNumber);
                rowData.push(getCellValue(cell));
            }
            
            if (rowData.some(cell => cell !== '')) {
                tableData.rows.push(rowData);
            }
        }

        // Add table
        await doc.table(tableData, {
            prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold'),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.fontSize(10).font('Helvetica');
                return row;
            },
            width: 750,
            padding: 5,
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
            },
            border: { size: 0.1, color: '#000000' }
        });

        // Add footer
        doc.fontSize(10).text(
            `Generated on: ${new Date().toLocaleDateString()}`,
            50,
            doc.page.height - 50,
            { align: 'left' }
        );

        doc.end();

        writeStream.on('finish', () => {
            res.json({
                message: "File uploaded and converted successfully",
                pdfPath: pdfPath
            });
        });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "Failed to process file: " + error.message });
    }
});

// Helper function to get cell value
function getCellValue(cell) {
    if (!cell || !cell.value) return '';
    if (cell.value.richText) {
        return cell.value.richText.map(rt => rt.text).join('');
    }
    if (cell.value.text) {
        return cell.value.text;
    }
    if (typeof cell.value === 'object') {
        return cell.value.result || '';
    }
    return cell.value.toString().trim();
}

// Route to get student details
app.get("/getStudentDetails/:registerNumber", async (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
        
        if (excelFiles.length === 0) {
            return res.status(404).json({ error: "No Excel file found" });
        }

        const latestFile = excelFiles[excelFiles.length - 1];
        const excelFilePath = path.join(uploadDir, latestFile);
        
        const studentData = await getStudentGradesFromExcel(excelFilePath, req.params.registerNumber);
        
        if (!studentData) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Generate PDF for student
        const pdfPath = path.join(uploadDir, `${studentData['Register No.']}_grades.pdf`);
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Add college logo
        doc.image(logoPath, 50, 45, { 
            width: 60,
            height: 60
        });

        // College header with exact spacing
        doc.font('Helvetica-Bold').fontSize(16)
           .text('VELAMMAL COLLEGE OF ENGINEERING & TECHNOLOGY', 120, 50, {
                align: 'center',
                width: doc.page.width - 140
           });

        doc.font('Helvetica').fontSize(12)
           .text('(Autonomous)', 120, 75, {
                align: 'center',
                width: doc.page.width - 140
           });

        doc.fontSize(11)
           .text('(Accredited by NAAC with \'A\' Grade and by NBA for 5 UG Programmes)', 120, 95, {
                align: 'center',
                width: doc.page.width - 140
           });

        doc.fontSize(11)
           .text('(Approved by AICTE and affiliated to Anna University, Chennai)', 120, 110, {
                align: 'center',
                width: doc.page.width - 140
           });

        doc.fontSize(11)
           .text('Velammal Nagar, Madurai - Rameswaram High Road, Viraganoor, Madurai - 625 009, Tamilnadu', 120, 125, {
                align: 'center',
                width: doc.page.width - 140
           });

        // Principal and contact details
        doc.font('Helvetica-Bold').fontSize(11)
           .text('Dr. P. Alli, M.S., Ph.D.', 50, 160);
        doc.font('Helvetica').fontSize(11)
           .text('Principal', 50, 175);

        doc.fontSize(11)
           .text('Phone : 0452 - 2465285 / 2465849, Tele Fax : 0452 - 2465289', {
                align: 'right',
                width: doc.page.width - 100,
                y: 160
           });
        doc.text('Web : www.vcet.ac.in   E-mail : principal@vcet.ac.in', {
                align: 'right',
                width: doc.page.width - 100,
                y: 175
           });

        // Horizontal line
        doc.moveTo(50, 195).lineTo(545, 195).stroke();

        // Reference number and date
        doc.fontSize(11)
           .text(`Ref: VCET/CSE/2024-2025/BC/${studentData['Register No.']}`, 50, 215);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, {
            align: 'right',
            width: doc.page.width - 100,
            y: 215
        });

        // Certificate title
        doc.font('Helvetica-Bold').fontSize(14)
           .text('BONAFIDE CERTIFICATE', {
                align: 'center',
                y: 255
           });

        // Certificate content with proper spacing and formatting
        const certificateText = `This is to certify that ${studentData['Name of the student']} (Roll No: ${studentData['Register No.']}) of III year B.E. 'A' Section in the Department of Computer Science and Engineering is a bonafide student of our College during the academic year 2024 - 2025. His Anna University result for IV Semester are as follows.`;

        doc.font('Helvetica').fontSize(11)
           .text(certificateText, 50, 290, {
                align: 'justify',
                width: doc.page.width - 100,
                lineGap: 5
           });

        // Add table with proper borders and spacing
        const tableTop = 360;
        const tableData = {
            headers: ['SUBJECT CODE', 'GRADE', 'RESULT'],
            rows: Object.entries(studentData.subjects).map(([code, grade]) => [code, grade, 'PASS'])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(11),
            prepareRow: () => doc.font('Helvetica').fontSize(11),
            width: 495,
            x: 50,
            y: tableTop,
            padding: 8,
            divider: {
                header: { disabled: false, width: 1, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
            },
            border: { size: 0.5, color: '#000000' }
        });

        // Purpose text
        doc.moveDown(4);
        doc.fontSize(11)
           .text('This certificate is issued for Scholarship purpose only.', 50, doc.y + 20);

        // Signature spaces
        doc.moveDown(4);
        doc.fontSize(11)
           .text('HOD/CSE', 50, doc.y + 40);
        doc.text('PRINCIPAL', {
            align: 'right',
            width: doc.page.width - 100,
            y: doc.y
        });

        doc.end();

        writeStream.on('finish', () => {
            // Send PDF file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${studentData['Register No.']}_grades.pdf`);
            fs.createReadStream(pdfPath).pipe(res);
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Route to view PDF
app.get("/viewPDF", (req, res) => {
    const pdfPath = path.join(uploadDir, 'converted.pdf');
    
    if (fs.existsSync(pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        fs.createReadStream(pdfPath).pipe(res);
    } else {
        res.status(404).json({ error: "PDF not found. Please upload an Excel file first." });
    }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
