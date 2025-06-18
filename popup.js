document.addEventListener('DOMContentLoaded', function() {
  const documentTypes = document.querySelectorAll('.document-type');
  const serialLengthInput = document.getElementById('serialLength');
  const serialInFilenameCheckbox = document.getElementById('serialInFilename');
  const previewArea = document.getElementById('previewArea');
  const previewImg = document.getElementById('previewImg');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const downloadLargeFileBtn = document.getElementById('downloadLargeFileBtn');
  const targetFileSizeInput = document.getElementById('targetFileSize');
  downloadPdfBtn.disabled = false;
  downloadLargeFileBtn.disabled = false;

  let lastCanvas = null;
  let lastFilename = '';
  let lastDocFields = '';
  let lastDocType = '';

  documentTypes.forEach(type => {
    type.addEventListener('click', async () => {
      const docType = type.getAttribute('data-type');
      const serialLength = parseInt(serialLengthInput.value, 10) || 18;
      const serialInFilename = serialInFilenameCheckbox.checked;
      const {canvas, filename, fieldsHtml, isTextPdf, textContent} = await generateAndPreviewDocument(docType, serialLength, serialInFilename);
      lastCanvas = canvas;
      lastFilename = filename;
      lastDocType = docType;
      
      // Store text content and serial for text PDF generation
      if (isTextPdf && textContent) {
        window.lastTextContent = textContent;
        window.lastSerialNumber = generateSerial(serialLength);
      }
      
      previewImg.src = canvas.toDataURL('image/png');
      previewArea.style.display = 'block';
      lastDocFields = fieldsHtml;
      document.getElementById('docTextFields').innerHTML = fieldsHtml;
      
      // Handle large file special case
      if (docType === 'largefile') {
        // Hide preview image and regular download buttons
        previewImg.style.display = 'none';
        copyBtn.style.display = 'none';
        downloadBtn.style.display = 'none';
        downloadPdfBtn.style.display = 'none';
        // Ensure target file size input is present and above the large file button
        let targetFileSizeContainer = document.getElementById('targetFileSizeContainer');
        if (!targetFileSizeContainer) {
          const container = document.createElement('div');
          container.id = 'targetFileSizeContainer';
          container.style.marginTop = '10px';
          container.innerHTML = `
            <label for="targetFileSize">Target File Size (MB):</label>
            <input type="number" id="targetFileSize" name="targetFileSize" min="1" max="85" step="1" style="width: 60px; margin-left: 5px;">
            <label style="margin-left: 5px;">Max approx 85mb</label>
          `;
          // Insert before the large file button
          if (downloadLargeFileBtn.parentNode === previewArea) {
            previewArea.insertBefore(container, downloadLargeFileBtn);
          } else {
            previewArea.appendChild(container);
          }
          targetFileSizeContainer = container;
        } else {
          targetFileSizeContainer.style.display = 'block';
          // Move it above the button if not already
          if (targetFileSizeContainer.nextSibling !== downloadLargeFileBtn) {
            previewArea.insertBefore(targetFileSizeContainer, downloadLargeFileBtn);
          }
        }
        // Ensure the large file button is visible and in the DOM
        downloadLargeFileBtn.style.display = 'inline-block';
        if (downloadLargeFileBtn.parentNode !== previewArea) {
          previewArea.appendChild(downloadLargeFileBtn);
        }
      } else if (docType === 'randomdoc') {
        // Show preview image and regular download buttons for random document
        previewImg.style.display = 'block';
        copyBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'inline-block';
        downloadPdfBtn.style.display = 'inline-block';
        // Hide large file button
        downloadLargeFileBtn.style.display = 'none';
        
        // Show random document options
        const randomDocOptionsContainer = document.getElementById('randomDocOptionsContainer');
        if (!randomDocOptionsContainer) {
          const container = document.createElement('div');
          container.id = 'randomDocOptionsContainer';
          container.style.marginTop = '10px';
          container.style.padding = '10px';
          container.style.border = '1px solid #ccc';
          container.style.borderRadius = '4px';
          container.style.backgroundColor = '#f9f9f9';
          container.innerHTML = `
            <div style="margin-bottom: 8px;"><strong>Random Document PDF Options:</strong></div>
            <div style="margin-bottom: 8px;">
              <label for="pageCount">Page Count:</label>
              <input type="number" id="pageCount" name="pageCount" min="1" max="50" value="1" style="width: 50px; margin-left: 5px;">
            </div>
            <div style="margin-bottom: 8px;">
              <label for="includeRandomImages">
                <input type="checkbox" id="includeRandomImages" name="includeRandomImages">
                Include Random Images
              </label>
            </div>
            <div style="font-size: 12px; color: #666;">
              Note: Random images will add decorative shapes to each page
            </div>
          `;
          previewArea.appendChild(container);
        } else {
          randomDocOptionsContainer.style.display = 'block';
        }
        
        // Hide target file size input
        const targetFileSizeContainer = document.getElementById('targetFileSizeContainer');
        if (targetFileSizeContainer) {
          targetFileSizeContainer.style.display = 'none';
        }
      } else {
        // Show preview image and regular download buttons for other document types
        previewImg.style.display = 'block';
        copyBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'inline-block';
        downloadPdfBtn.style.display = 'inline-block';
        // Hide large file button
        downloadLargeFileBtn.style.display = 'none';
        
        // Hide all option containers
        const targetFileSizeContainer = document.getElementById('targetFileSizeContainer');
        if (targetFileSizeContainer) {
          targetFileSizeContainer.style.display = 'none';
        }
        const randomDocOptionsContainer = document.getElementById('randomDocOptionsContainer');
        if (randomDocOptionsContainer) {
          randomDocOptionsContainer.style.display = 'none';
        }
      }
    });
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastCanvas) return;
    lastCanvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 1500);
      } catch (e) {
        copyBtn.textContent = 'Failed!';
        setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 1500);
      }
    }, 'image/png');
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastCanvas) return;
    lastCanvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lastFilename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });

  downloadPdfBtn.addEventListener('click', async () => {
    if (!lastCanvas) return;
    const { jsPDF } = window.jspdf;
    
    // Check if this is a text PDF (randomdoc)
    if (lastDocType === 'randomdoc') {
      // Get options from UI controls
      const pageCountInput = document.getElementById('pageCount');
      const includeRandomImagesCheckbox = document.getElementById('includeRandomImages');
      
      const options = {
        pageCount: pageCountInput ? parseInt(pageCountInput.value, 10) || 1 : 1,
        includeRandomImages: includeRandomImagesCheckbox ? includeRandomImagesCheckbox.checked : false,
        textOnly: !(includeRandomImagesCheckbox ? includeRandomImagesCheckbox.checked : false)
      };
      
      await generateRandomDocumentPdf(options, lastFilename);
      return;
    }
    
    // Default image-based PDF for other document types
    const imgData = lastCanvas.toDataURL('image/png');
    let pdf;
    let pdfWidth = lastCanvas.width;
    let pdfHeight = lastCanvas.height;
    // Default single-page PDF for all document types except largefile
    if (pdfWidth === 794 && pdfHeight === 1123) {
      pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdfWidth = 210;
      pdfHeight = 297;
    } else {
      pdfWidth = pdfWidth * 0.2646;
      pdfHeight = pdfHeight * 0.2646;
      pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
    }
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(lastFilename.replace(/\.png$/, '.pdf'));
  });

  downloadLargeFileBtn.addEventListener('click', async () => {
    if (!lastCanvas || lastDocType !== 'largefile') return;
    const { jsPDF } = window.jspdf;
    
    // Get the target file size input dynamically since it's created when large file is selected
    const targetFileSizeInput = document.getElementById('targetFileSize');
    if (!targetFileSizeInput) {
      alert('Please select "Large File" document type first.');
      return;
    }
    
    let targetMB = parseInt(targetFileSizeInput.value, 10);
    if (!targetMB || targetMB <= 2) {
      alert('Please enter a target file size greater than 2MB for large file generation.');
      return;
    }
    
    // Show flashing 'please wait' message
    let pleaseWaitElem = document.createElement('div');
    pleaseWaitElem.id = 'pleaseWaitMsg';
    pleaseWaitElem.textContent = 'Please wait...';
    pleaseWaitElem.style.fontWeight = 'bold';
    pleaseWaitElem.style.fontSize = '18px';
    pleaseWaitElem.style.color = '#c62828';
    pleaseWaitElem.style.margin = '10px 0';
    pleaseWaitElem.style.transition = 'opacity 0.3s';
    pleaseWaitElem.style.opacity = '1';
    previewArea.appendChild(pleaseWaitElem);
    let visible = true;
    let pleaseWaitInterval = setInterval(() => {
      visible = !visible;
      pleaseWaitElem.style.opacity = visible ? '1' : '0.2';
    }, 400);
    
    if (targetMB > 10) {
      alert('Generating a file larger than 10MB may take a while. Please be patient while the PDF is created.');
    }
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const largeImg = new Image();
    largeImg.src = 'icons/large7.jpg';
    await new Promise((resolve, reject) => {
      largeImg.onload = resolve;
      largeImg.onerror = reject;
    });
    
    let pageCount = 1;
    let pdfBlob;
    while (true) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 794;
      tempCanvas.height = 1123;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(largeImg, 0, 0, tempCanvas.width, tempCanvas.height);
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      tempCtx.fillStyle = `rgb(${r},${g},${b})`;
      tempCtx.fillRect(0, 0, 1, 1);
      const largeImgData = tempCanvas.toDataURL('image/jpeg', 0.95);
      if (pageCount === 1) {
        pdf.addImage(largeImgData, 'JPEG', 0, 0, 210, 297);
        // Add disclaimer text at the top of the first page
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(68,68,68);
        pdf.text('This document is used for testing purpose and contains generated sample data from random text generators.', 105, 20, {align: 'center'});
        pdf.setTextColor(0,0,0);
        // Add serial number and datestamp below disclaimer
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const serial = window.lastSerialNumber || generateSerial(18);
        const dateTimeStr = getFormattedDateTime();
        pdf.text(`Serial: ${serial}`, 105, 30, {align: 'center'});
        pdf.text(`Generated: ${dateTimeStr}`, 105, 38, {align: 'center'});
      } else {
        pdf.addPage();
        pdf.addImage(largeImgData, 'JPEG', 0, 0, 210, 297);
      }
      pdfBlob = pdf.output('blob');
      if (pdfBlob.size >= targetMB * 1024 * 1024 || pageCount >= 300) break;
      pageCount++;
    }
    
    if (pdfBlob.size < targetMB * 1024 * 1024) {
      alert('Warning: Could not reach the target file size after 300 pages.');
    }
    
    pdf.save(lastFilename.replace(/\.png$/, '.pdf'));
    // Remove flashing message
    clearInterval(pleaseWaitInterval);
    pleaseWaitElem.remove();
  });
});

function generateSerial(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let serial = '';
  for (let i = 0; i < length; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

function drawRandomPixelPerson(ctx, x, y, size) {
  // 8x8 grid
  const grid = 8;
  const pixel = size / grid;
  // Random colors
  const skinTones = ['#fcd7b6', '#eac086', '#c68642', '#8d5524', '#f1c27d'];
  const hairColors = ['#2c1b10', '#a0522d', '#d2b48c', '#000', '#fff', '#888'];
  const shirtColors = ['#1976d2', '#388e3c', '#c62828', '#fbc02d', '#7b1fa2', '#00838f'];
  const bgColors = ['#e3f2fd', '#fffde7', '#fce4ec', '#e8f5e9', '#f3e5f5'];
  const skin = skinTones[Math.floor(Math.random() * skinTones.length)];
  const hair = hairColors[Math.floor(Math.random() * hairColors.length)];
  const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
  const bg = bgColors[Math.floor(Math.random() * bgColors.length)];

  // Draw background
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, size, size);

  // Draw head (centered, 4x4 block)
  ctx.fillStyle = skin;
  for (let i = 2; i < 6; i++) {
    for (let j = 1; j < 5; j++) {
      ctx.fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    }
  }
  // Draw hair (top rows)
  ctx.fillStyle = hair;
  for (let i = 2; i < 6; i++) {
    ctx.fillRect(x + i * pixel, y + 1 * pixel, pixel, pixel);
    if (Math.random() > 0.5) ctx.fillRect(x + i * pixel, y, pixel, pixel);
  }
  // Draw eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(x + 3 * pixel, y + 3 * pixel, pixel, pixel);
  ctx.fillRect(x + 4 * pixel, y + 3 * pixel, pixel, pixel);
  // Draw mouth
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(x + 3 * pixel, y + 5 * pixel, 2 * pixel, pixel);
  // Draw shirt (bottom rows)
  ctx.fillStyle = shirt;
  for (let i = 2; i < 6; i++) {
    ctx.fillRect(x + i * pixel, y + 6 * pixel, pixel, pixel);
    ctx.fillRect(x + i * pixel, y + 7 * pixel, pixel, pixel);
  }
  // Shoulders
  ctx.fillRect(x + 1 * pixel, y + 7 * pixel, pixel, pixel);
  ctx.fillRect(x + 6 * pixel, y + 7 * pixel, pixel, pixel);
}

function drawSimpleWorldMap(ctx, x, y, w, h) {
  // Draw a faint, abstract world map (just some continents shapes)
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#1976d2';
  // Rough shapes for continents (very abstract)
  ctx.beginPath();
  ctx.moveTo(x + w*0.15, y + h*0.4); ctx.bezierCurveTo(x + w*0.1, y + h*0.2, x + w*0.3, y + h*0.1, x + w*0.4, y + h*0.3); // North America
  ctx.bezierCurveTo(x + w*0.5, y + h*0.5, x + w*0.2, y + h*0.6, x + w*0.15, y + h*0.4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w*0.5, y + h*0.5); ctx.bezierCurveTo(x + w*0.6, y + h*0.3, x + w*0.8, y + h*0.2, x + w*0.85, y + h*0.4); // Eurasia
  ctx.bezierCurveTo(x + w*0.8, y + h*0.6, x + w*0.6, y + h*0.7, x + w*0.5, y + h*0.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w*0.7, y + h*0.7); ctx.bezierCurveTo(x + w*0.75, y + h*0.8, x + w*0.85, y + h*0.85, x + w*0.8, y + h*0.95); // Australia
  ctx.bezierCurveTo(x + w*0.7, y + h*0.9, x + w*0.65, y + h*0.8, x + w*0.7, y + h*0.7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w*0.45, y + h*0.7); ctx.bezierCurveTo(x + w*0.5, y + h*0.8, x + w*0.6, y + h*0.85, x + w*0.55, y + h*0.95); // South America
  ctx.bezierCurveTo(x + w*0.45, y + h*0.9, x + w*0.4, y + h*0.8, x + w*0.45, y + h*0.7);
  ctx.fill();
  ctx.restore();
}

function drawRandomStamp(ctx, x, y, w, h, country, date) {
  // Random color for stamp
  const colors = ['#d32f2f', '#388e3c', '#1976d2', '#fbc02d', '#7b1fa2', '#00838f'];
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h/2, w/2, h/2, Math.random() * Math.PI, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.textAlign = 'center';
  ctx.fillText(country, x + w/2, y + h/2 - 4);
  ctx.font = '12px Arial';
  ctx.fillText(date, x + w/2, y + h/2 + 14);
  ctx.restore();
}

async function generateAndPreviewDocument(docType, serialLength = 18, serialInFilename = true) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const serialNumber = generateSerial(serialLength);
  const currentDateTime = getFormattedDateTime();
  // Sentences array for randomdoc
  const sentences = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae velit ex.",
    "The quick brown fox jumps over the lazy dog, demonstrating every letter in the English language.",
    "Sample document for testing various layouts and text rendering scenarios in quality assurance workflows.",
    "Randomized content for QA ensures robust handling of edge cases and unexpected input.",
    "This is a generated document intended for use in automated testing environments.",
    "Hello, world! This phrase is often used as the first output in programming tutorials.",
    "Testing shapes, images, and text fields to validate rendering and export functionality.",
    "Generated at random, this document simulates a variety of real-world data scenarios.",
    "Quality assured by Zamaqo, your trusted partner in software testing and validation.",
    "Document simulation complete. Please review the generated content for accuracy.",
    "The rain in Spain stays mainly in the plain, according to the classic tongue twister.",
    "All your base are belong to us. This phrase became an internet meme in the early 2000s.",
    "A journey of a thousand miles begins with a single step, as the proverb wisely states.",
    "In the middle of difficulty lies opportunity, a reminder to persevere through challenges.",
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "She sells seashells by the seashore, a classic example of alliteration.",
    "To be, or not to be, that is the question posed by Shakespeare in Hamlet.",
    "The quick onyx goblin jumps over the lazy dwarf, another pangram for testing.",
    "Pack my box with five dozen liquor jugs, a sentence using every letter.",
    "Sphinx of black quartz, judge my vow, a short and elegant pangram.",
    "The five boxing wizards jump quickly, a phrase used for font testing.",
    "How razorback-jumping frogs can level six piqued gymnasts!",
    "Cozy lummox gives smart squid who asks for job pen.",
    "Grumpy wizards make toxic brew for the jovial queen.",
    "Jackdaws love my big sphinx of quartz.",
    "Waltz, nymph, for quick jigs vex Bud.",
    "Glib jocks quiz nymph to vex dwarf.",
    "Amazingly few discotheques provide jukeboxes.",
    "Heavy boxes perform quick waltzes and jigs.",
    "Jinxed wizards pluck ivy from the big quilt.",
    "Brawny gods just flocked up to quiz and vex him.",
    "Quick zephyrs blow, vexing daft Jim.",
    "Two driven jocks help fax my big quiz.",
    "Five quacking zephyrs jolt my wax bed.",
    "The job requires extra pluck and zeal from every young wage earner.",
    "A wizard's job is to vex chumps quickly in fog.",
    "Watch 'Jeopardy!', Alex Trebek's fun TV quiz game.",
    "By Jove, my quick study of lexicography won a prize.",
    "Woven silk pyjamas exchanged for blue quartz.",
    "A quivering Texas zombie fought republic linked jewelry.",
    "Back in June we delivered oxygen equipment of the same size.",
    "Just keep examining every low bid quoted for zinc etchings.",
    "The public was amazed to view the quickness and dexterity of the juggler.",
    "We promptly judged antique ivory buckles for the next prize.",
    "Crazy Frederick bought many very exquisite opal jewels.",
    "Sixty zippers were quickly picked from the woven jute bag.",
    "Amazingly, the quick brown fox jumped over the lazy dogs.",
    "The explorer was frozen in his big kayak just after making queer discoveries.",
    "The jovial zookeeper quickly mixed up the food for the big panda.",
    "A quick movement of the enemy will jeopardize six gunboats.",
    "The quick brown fox jumps over the lazy dog while the wizard watches.",
    "Zamaqo's automated systems ensure every document is unique and robust.",
    "This document was generated for the purpose of comprehensive software testing.",
    "Every field, image, and shape is randomized to simulate real-world data.",
    "Please verify that all information is correct and meets your requirements.",
    "If you find any issues, please report them to the QA team for review.",
    "The system can generate thousands of unique documents for bulk testing.",
    "Randomized shapes and images help test the rendering engine's flexibility.",
    "Text fields are filled with a variety of content to ensure compatibility.",
    "Thank you for using Zamaqo's document generator for your testing needs.",
    "This is a sample sentence to test text wrapping and overflow handling.",
    "The generated document is not valid for official use and is for testing only.",
    "All data in this document is fictitious and randomly generated.",
    "The quick brown fox jumps over the lazy dog, again and again.",
    "Sample data helps developers and testers validate their applications.",
    "This line is intentionally long to test how the document handles extended text fields and wrapping in the layout."
  ];
  window.randomDocSentences = sentences;
  // Set canvas size based on document type
  switch(docType) {
    case 'id': {
      canvas.width = 600;
      canvas.height = 400;
      // Remove green background (use white)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw large, light, random three-letter code in the background, stretched vertically
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
      const codeColors = ['#1565c0', '#00838f', '#7b1fa2', '#c62828', '#388e3c', '#fbc02d'];
      const codeColor = codeColors[Math.floor(Math.random() * codeColors.length)];
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.font = 'bold 240px Arial';
      ctx.fillStyle = codeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.setTransform(1, 0, 0, 1.7, 0, 0); // Stretch vertically to almost full height
      ctx.fillText(code, canvas.width/2, (canvas.height/2 + 20)/1.7);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.restore();
      // Generate random details
      const firstNames = [
        'John','Jane','Alex','Emily','Chris','Olivia','Sam','Ava','Max','Sophia',
        'Liam','Noah','Emma','Mia','Lucas','Amelia','Ethan','Isabella','Mason','Charlotte',
        'Logan','Harper','Elijah','Evelyn','Oliver','Abigail','Jacob','Ella','Aiden','Scarlett',
        'Benjamin','Grace','Daniel','Chloe','Matthew','Victoria','Henry','Lily','Jackson','Hannah',
        'Sebastian','Zoe','Jack','Penelope','Owen','Layla','Gabriel','Aria','Carter','Ellie',
        'Julian','Nora','Leo','Hazel','David','Aurora','Isaac','Camila','Jayden','Sofia',
        'Mateo','Elena','Dylan','Aaliyah','Ezra','Leah','Nathan','Mila','Aaron','Stella',
        'Muhammad','Fatima','Ali','Aisha','Omar','Zara','Yusuf','Layla','Ahmed','Sara',
        'Wei','Mei','Hiro','Yuki','Santiago','Valentina','Diego','Lucia','Enzo','Giulia',
        'Luca','Francesca','Ivan','Anastasia','Viktor','Elena','Pavel','Irina','Jin','Min'
      ];
      const lastNames = [
        'Doe','Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Moore',
        'Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez',
        'Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','King',
        'Wright','Scott','Torres','Nguyen','Hill','Green','Adams','Baker','Gonzalez','Nelson',
        'Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards',
        'Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy',
        'Rivera','Cooper','Richardson','Cox','Howard','Ward','Flores','Kim','Patel','Ng',
        'Zhang','Chen','Wang','Li','Singh','Kumar','Sharma','Gupta','Das','Ahmed',
        'Hassan','Ali','Mohamed','Yilmaz','Demir','Kaya','Popov','Ivanov','Petrov','Sokolov',
        'Smirnov','Novak','Horvat','Kovačić','Nielsen','Larsen','Jensen','Olsen','Rossi','Russo'
      ];
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const year = Math.floor(Math.random() * 30) + 1970;
      const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
      const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
      const dob = `${day}/${month}/${year}`;
      const idNum = Math.floor(10000000 + Math.random() * 90000000);
      // Draw pixel-art person (left side)
      drawRandomPixelPerson(ctx, 40, 140, 144);
      // Draw details
      ctx.font = '18px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText('Sample ID Card', 180, 130);
      ctx.fillText(`Name: ${name}`, 180, 160);
      ctx.fillText(`DOB: ${dob}`, 180, 190);
      ctx.fillText(`ID No: ${idNum}`, 180, 220);
      ctx.fillText(`Issued: ${currentDateTime}`, 180, 250);
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#1565c0';
      ctx.fillText(`Serial: ${serialNumber}`, 180, 280);
      // Draw Zamaqo logo
      await new Promise((resolve) => {
        const logo = new Image();
        logo.src = 'icons/zamaqo_logo_large_1568x562_54KB.png';
        logo.onload = function() {
          const maxLogoWidth = 150;
          const maxLogoHeight = 60;
          let logoWidth = logo.width;
          let logoHeight = logo.height;
          const widthRatio = maxLogoWidth / logoWidth;
          const heightRatio = maxLogoHeight / logoHeight;
          const scale = Math.min(widthRatio, heightRatio);
          logoWidth *= scale;
          logoHeight *= scale;
          ctx.drawImage(logo, canvas.width - logoWidth - 20, 20, logoWidth, logoHeight);
          resolve();
        };
        logo.onerror = resolve;
      });
      const fieldsHtml = `<b>Name:</b> ${name}<br><b>DOB:</b> ${dob}<br><b>ID No:</b> ${idNum}<br><b>Issued:</b> ${currentDateTime}<br><b>Serial:</b> ${serialNumber}`;
      const filename = `zamaqo_sample_${docType}_${currentDateTime.replace(/:/g, '-')}${serialInFilename ? '_'+serialNumber : ''}.png`;
      return {canvas, filename, fieldsHtml};
    }
    case 'passport': {
      canvas.width = 800;
      canvas.height = 500;
      // Light red background
      ctx.fillStyle = '#ffeaea';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw faint world map background
      drawSimpleWorldMap(ctx, 0, 0, canvas.width, canvas.height);
      // Generate random details
      const firstNames = [
        'John','Jane','Alex','Emily','Chris','Olivia','Sam','Ava','Max','Sophia',
        'Liam','Noah','Emma','Mia','Lucas','Amelia','Ethan','Isabella','Mason','Charlotte',
        'Logan','Harper','Elijah','Evelyn','Oliver','Abigail','Jacob','Ella','Aiden','Scarlett',
        'Benjamin','Grace','Daniel','Chloe','Matthew','Victoria','Henry','Lily','Jackson','Hannah',
        'Sebastian','Zoe','Jack','Penelope','Owen','Layla','Gabriel','Aria','Carter','Ellie',
        'Julian','Nora','Leo','Hazel','David','Aurora','Isaac','Camila','Jayden','Sofia',
        'Mateo','Elena','Dylan','Aaliyah','Ezra','Leah','Nathan','Mila','Aaron','Stella',
        'Muhammad','Fatima','Ali','Aisha','Omar','Zara','Yusuf','Layla','Ahmed','Sara',
        'Wei','Mei','Hiro','Yuki','Santiago','Valentina','Diego','Lucia','Enzo','Giulia',
        'Luca','Francesca','Ivan','Anastasia','Viktor','Elena','Pavel','Irina','Jin','Min'
      ];
      const lastNames = [
        'Doe','Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Moore',
        'Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez',
        'Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','King',
        'Wright','Scott','Torres','Nguyen','Hill','Green','Adams','Baker','Gonzalez','Nelson',
        'Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards',
        'Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy',
        'Rivera','Cooper','Richardson','Cox','Howard','Ward','Flores','Kim','Patel','Ng',
        'Zhang','Chen','Wang','Li','Singh','Kumar','Sharma','Gupta','Das','Ahmed',
        'Hassan','Ali','Mohamed','Yilmaz','Demir','Kaya','Popov','Ivanov','Petrov','Sokolov',
        'Smirnov','Novak','Horvat','Kovačić','Nielsen','Larsen','Jensen','Olsen','Rossi','Russo'
      ];
      const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'South Africa', 'India', 'Italy', 'Spain', 'Mexico', 'Sweden', 'Norway', 'New Zealand', 'Singapore', 'Netherlands', 'Switzerland', 'Argentina'];
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const year = Math.floor(Math.random() * 30) + 1970;
      const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
      const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
      const dob = `${day}/${month}/${year}`;
      const passportNum = 'P' + Math.floor(10000000 + Math.random() * 90000000);
      const country = countries[Math.floor(Math.random() * countries.length)];
      // Generate random expiry date (up to 5 years from now)
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + Math.floor(Math.random() * 5) + 1);
      expiry.setMonth(Math.floor(Math.random() * 12));
      expiry.setDate(Math.floor(Math.random() * 28) + 1);
      const expiryStr = expiry.toLocaleDateString();
      // Draw pixel-art person (photo area)
      drawRandomPixelPerson(ctx, 40, 120, 168);
      // Draw details
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#222';
      ctx.fillText('Sample Passport', 220, 90);
      ctx.font = '20px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(`Name: ${name}`, 220, 140);
      ctx.fillText(`DOB: ${dob}`, 220, 180);
      ctx.fillText(`Passport No: ${passportNum}`, 220, 220);
      ctx.fillText(`Country of Issue: ${country}`, 220, 260);
      ctx.fillText(`Issued: ${currentDateTime}`, 220, 300);
      ctx.fillText(`Expiry Date: ${expiryStr}`, 220, 340);
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#1565c0';
      ctx.fillText(`Serial: ${serialNumber}`, 220, 370);
      // Draw 4-7 random entry stamps on the right, avoiding overlap
      const stampCount = 4 + Math.floor(Math.random() * 4);
      const placedStamps = [];
      for (let i = 0; i < stampCount; i++) {
        const stampCountry = countries[Math.floor(Math.random() * countries.length)];
        const stampDate = `${(Math.floor(Math.random()*28)+1).toString().padStart(2,'0')}/${(Math.floor(Math.random()*12)+1).toString().padStart(2,'0')}/${1970+Math.floor(Math.random()*54)}`;
        let sx, sy, tries = 0, overlaps;
        const sw = 90, sh = 50;
        do {
          sx = 500 + Math.random() * 220;
          sy = 60 + Math.random() * 350;
          overlaps = false;
          for (const s of placedStamps) {
            // Check if centers are closer than width or height (simple overlap check)
            const dx = (sx + sw/2) - (s.x + sw/2);
            const dy = (sy + sh/2) - (s.y + sh/2);
            if (Math.abs(dx) < sw && Math.abs(dy) < sh) {
              overlaps = true;
              break;
            }
          }
          tries++;
        } while (overlaps && tries < 20);
        placedStamps.push({x: sx, y: sy});
        drawRandomStamp(ctx, sx, sy, sw, sh, stampCountry, stampDate);
      }
      // Draw Zamaqo logo
      await new Promise((resolve) => {
        const logo = new Image();
        logo.src = 'icons/zamaqo_logo_large_1568x562_54KB.png';
        logo.onload = function() {
          const maxLogoWidth = 150;
          const maxLogoHeight = 60;
          let logoWidth = logo.width;
          let logoHeight = logo.height;
          const widthRatio = maxLogoWidth / logoWidth;
          const heightRatio = maxLogoHeight / logoHeight;
          const scale = Math.min(widthRatio, heightRatio);
          logoWidth *= scale;
          logoHeight *= scale;
          ctx.drawImage(logo, canvas.width - logoWidth - 20, 20, logoWidth, logoHeight);
          resolve();
        };
        logo.onerror = resolve;
      });
      const fieldsHtml = `<b>Name:</b> ${name}<br><b>DOB:</b> ${dob}<br><b>Passport No:</b> ${passportNum}<br><b>Country of Issue:</b> ${country}<br><b>Issued:</b> ${currentDateTime}<br><b>Expiry Date:</b> ${expiryStr}<br><b>Serial:</b> ${serialNumber}`;
      const filename = `zamaqo_sample_${docType}_${currentDateTime.replace(/:/g, '-')}${serialInFilename ? '_'+serialNumber : ''}.png`;
      return {canvas, filename, fieldsHtml};
    }
    case 'wine':
      canvas.width = 400;
      canvas.height = 800;
      break;
    case 'degree': {
      canvas.width = 1000;
      canvas.height = 700;
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // College names list
      const collegeNames = [
        'Harvard University', 'Stanford University', 'Massachusetts Institute of Technology', 'University of California',
        'University of Cambridge', 'University of Oxford', 'California Institute of Technology', 'Princeton University',
        'Yale University', 'University of Chicago', 'Columbia University', 'University of Pennsylvania',
        'ETH Zurich', 'University of Toronto', 'University of Michigan', 'Imperial College London',
        'Johns Hopkins University', 'Duke University', 'Northwestern University', 'University of Edinburgh',
        'University of California, Los Angeles', 'Cornell University', 'University of Washington', 'University of Melbourne',
        'Peking University', 'Tsinghua University', 'National University of Singapore', 'University of Hong Kong',
        'University of Sydney', 'University of British Columbia', 'University of Manchester', 'Australian National University',
        'University of Copenhagen', 'University of Tokyo', 'Seoul National University', 'University of Amsterdam',
        'University of Zurich', 'University of New South Wales', 'University of Queensland', 'University of Bristol',
        'University of Warwick', 'University of Glasgow', 'University of Alberta', 'University of Helsinki',
        'University of Auckland', 'University of Cape Town', 'University of Oslo', 'University of Vienna',
        'University of Barcelona', 'University of Munich', 'University of Geneva', 'University of Padua',
        'University of Milan', 'University of Rome', 'University of Bologna', 'University of Lisbon',
        'University of Porto', 'University of Granada', 'University of Valencia', 'University of Seville',
        'University of Salamanca', 'University of Navarra', 'University of Lausanne', 'University of Basel',
        'University of Bern', 'University of Freiburg', 'University of Göttingen', 'University of Hamburg',
        'University of Cologne', 'University of Leipzig', 'University of Münster', 'University of Würzburg',
        'University of Kiel', 'University of Bremen', 'University of Stuttgart', 'University of Erlangen',
        'University of Tübingen', 'University of Marburg', 'University of Mainz', 'University of Bochum',
        'University of Duisburg-Essen', 'University of Paderborn', 'University of Siegen', 'University of Hagen',
        'University of Kassel', 'University of Rostock', 'University of Greifswald', 'University of Regensburg',
        'University of Passau', 'University of Trier', 'University of Hohenheim', 'University of Ulm',
        'University of Konstanz', 'University of Bayreuth', 'University of Potsdam', 'University of Oldenburg',
        'University of Magdeburg', 'University of Wuppertal', 'University of Koblenz-Landau', 'University of Lüneburg'
      ];
      const collegeName = collegeNames[Math.floor(Math.random() * collegeNames.length)];
      // Print college name in the background at a 45-degree angle
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(-Math.PI/4); // 45 degrees
      ctx.font = 'bold 100px Arial';
      ctx.fillStyle = '#1565c0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(collegeName, 0, 0);
      ctx.restore();
      // Generate random details
      const firstNames = [
        'John','Jane','Alex','Emily','Chris','Olivia','Sam','Ava','Max','Sophia',
        'Liam','Noah','Emma','Mia','Lucas','Amelia','Ethan','Isabella','Mason','Charlotte',
        'Logan','Harper','Elijah','Evelyn','Oliver','Abigail','Jacob','Ella','Aiden','Scarlett',
        'Benjamin','Grace','Daniel','Chloe','Matthew','Victoria','Henry','Lily','Jackson','Hannah',
        'Sebastian','Zoe','Jack','Penelope','Owen','Layla','Gabriel','Aria','Carter','Ellie',
        'Julian','Nora','Leo','Hazel','David','Aurora','Isaac','Camila','Jayden','Sofia',
        'Mateo','Elena','Dylan','Aaliyah','Ezra','Leah','Nathan','Mila','Aaron','Stella',
        'Muhammad','Fatima','Ali','Aisha','Omar','Zara','Yusuf','Layla','Ahmed','Sara',
        'Wei','Mei','Hiro','Yuki','Santiago','Valentina','Diego','Lucia','Enzo','Giulia',
        'Luca','Francesca','Ivan','Anastasia','Viktor','Elena','Pavel','Irina','Jin','Min'
      ];
      const lastNames = [
        'Doe','Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Moore',
        'Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez',
        'Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','King',
        'Wright','Scott','Torres','Nguyen','Hill','Green','Adams','Baker','Gonzalez','Nelson',
        'Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards',
        'Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy',
        'Rivera','Cooper','Richardson','Cox','Howard','Ward','Flores','Kim','Patel','Ng',
        'Zhang','Chen','Wang','Li','Singh','Kumar','Sharma','Gupta','Das','Ahmed',
        'Hassan','Ali','Mohamed','Yilmaz','Demir','Kaya','Popov','Ivanov','Petrov','Sokolov',
        'Smirnov','Novak','Horvat','Kovačić','Nielsen','Larsen','Jensen','Olsen','Rossi','Russo'
      ];
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      // Formal text at the top (moved down)
      ctx.font = '22px Times New Roman, Times, serif';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.fillText(`THE REGENTS OF`, canvas.width/2, 110);
      ctx.font = '28px Times New Roman, Times, serif';
      ctx.fillText(collegeName, canvas.width/2, 150);
      ctx.font = '20px Times New Roman, Times, serif';
      ctx.fillText(`on the recommendation of the faculty of`, canvas.width/2, 190);
      ctx.fillText(`hereby confers upon`, canvas.width/2, 220);
      // Recipient's name (moved down)
      ctx.font = 'bold 48px Times New Roman, Times, serif';
      ctx.fillText(name, canvas.width/2, 270);
      // Degree and details (moved down)
      ctx.font = '22px Times New Roman, Times, serif';
      ctx.fillText(`the degree of Bachelor of Science`, canvas.width/2, 310);
      ctx.fillText(`with a major in Computer Science`, canvas.width/2, 345);
      ctx.fillText(`with all the rights and privileges thereto pertaining`, canvas.width/2, 380);
      ctx.fillText(`Given at ${collegeName}`, canvas.width/2, 420);
      ctx.fillText(`this day: ${currentDateTime}`, canvas.width/2, 450);
      // Serial number (moved down)
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#1565c0';
      ctx.fillText(`Serial: ${serialNumber}`, canvas.width/2, 480);
      // Signature lines and names (limit to 3)
      const sigNames = [
        'A. Hamilton', 'B. Franklin', 'C. Darwin', 'D. Curie', 'E. Tesla', 'F. Newton', 'G. Einstein', 'H. Hopper',
        'I. Lovelace', 'J. Turing', 'K. Noether', 'L. Pasteur', 'M. Bohr', 'N. Fermi', 'O. Euler', 'P. Dirac',
        'Q. Planck', 'R. Feynman', 'S. Hawking', 'T. Sagan', 'U. Faraday', 'V. Maxwell', 'W. Pauli', 'X. Schrödinger',
        'Y. Born', 'Z. Heisenberg'
      ];
      const sigTitles = [
        'President', 'Dean', 'Registrar', 'Provost', 'Chancellor', 'Vice Chancellor', 'Faculty Chair', 'Board Member'
      ];
      for (let i = 0; i < 3; i++) {
        const sigX = 180 + i * 250;
        const sigY = canvas.height - 120;
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sigX, sigY);
        ctx.lineTo(sigX + 180, sigY);
        ctx.stroke();
        ctx.font = 'italic 18px Times New Roman, Times, serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(sigNames[Math.floor(Math.random() * sigNames.length)], sigX + 90, sigY + 22);
        ctx.font = '14px Arial';
        ctx.fillText(sigTitles[Math.floor(Math.random() * sigTitles.length)], sigX + 90, sigY + 40);
        ctx.restore();
      }
      // Draw double scroll-style decorative border
      ctx.save();
      ctx.strokeStyle = '#d4af37'; // gold color
      ctx.lineWidth = 8;
      // Outer border
      ctx.beginPath();
      ctx.moveTo(30, 30);
      ctx.bezierCurveTo(10, 60, 60, 80, 80, 40);
      ctx.lineTo(canvas.width - 80, 40);
      ctx.bezierCurveTo(canvas.width - 60, 80, canvas.width - 10, 60, canvas.width - 30, 30);
      ctx.lineTo(canvas.width - 30, canvas.height - 80);
      ctx.bezierCurveTo(canvas.width - 10, canvas.height - 60, canvas.width - 60, canvas.height - 10, canvas.width - 80, canvas.height - 30);
      ctx.lineTo(80, canvas.height - 30);
      ctx.bezierCurveTo(60, canvas.height - 10, 10, canvas.height - 60, 30, canvas.height - 80);
      ctx.lineTo(30, 30);
      ctx.stroke();
      // Inner border (offset by 10px)
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.bezierCurveTo(20, 70, 70, 90, 90, 50);
      ctx.lineTo(canvas.width - 90, 50);
      ctx.bezierCurveTo(canvas.width - 70, 90, canvas.width - 20, 70, canvas.width - 40, 40);
      ctx.lineTo(canvas.width - 40, canvas.height - 90);
      ctx.bezierCurveTo(canvas.width - 20, canvas.height - 70, canvas.width - 70, canvas.height - 20, canvas.width - 90, canvas.height - 40);
      ctx.lineTo(90, canvas.height - 40);
      ctx.bezierCurveTo(70, canvas.height - 20, 20, canvas.height - 70, 40, canvas.height - 90);
      ctx.lineTo(40, 40);
      ctx.stroke();
      ctx.restore();
      // Place the seal image in the whitespace next to the 'this day' date
      await new Promise((resolve) => {
        const sealImg = new Image();
        sealImg.src = 'icons/seal.png';
        sealImg.onload = function() {
          ctx.drawImage(sealImg, canvas.width/2 + 220, 390, 100, 100);
          resolve();
        };
        sealImg.onerror = resolve;
      });
      const fieldsHtml = `<b>Degree:</b> Bachelor of Science<br><b>Major:</b> Computer Science<br><b>Name:</b> ${name}<br><b>Issued:</b> ${currentDateTime}<br><b>Serial:</b> ${serialNumber}`;
      const filename = `zamaqo_sample_${docType}_${currentDateTime.replace(/:/g, '-')}${serialInFilename ? '_'+serialNumber : ''}.png`;
      return {canvas, filename, fieldsHtml};
    }
    case 'divelog':
      canvas.width = 800;
      canvas.height = 600;
      break;
    case 'randomdoc': {
      canvas.width = 794; // A4 width at 72dpi
      canvas.height = 1123; // A4 height at 72dpi
      // Random pastel background
      const bgColors = ['#fce4ec', '#e3f2fd', '#fffde7', '#e8f5e9', '#f3e5f5', '#e6f9e6', '#ffeaea'];
      ctx.fillStyle = bgColors[Math.floor(Math.random() * bgColors.length)];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw random shapes
      const shapeCount = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < shapeCount; i++) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.random() * 0.4;
        ctx.fillStyle = `hsl(${Math.floor(Math.random()*360)},70%,80%)`;
        const x = Math.random() * (canvas.width - 100);
        const y = Math.random() * (canvas.height - 100);
        const w = 40 + Math.random() * 80;
        const h = 40 + Math.random() * 80;
        const shapeType = Math.floor(Math.random() * 3);
        if (shapeType === 0) ctx.fillRect(x, y, w, h);
        else if (shapeType === 1) {
          ctx.beginPath(); ctx.arc(x + w/2, y + h/2, Math.min(w,h)/2, 0, 2*Math.PI); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(x + Math.random()*w, y + Math.random()*h);
          }
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      // Draw 10-20 random sentences (like a letter, grouped into paragraphs, max 70 chars per line)
      const sentenceCount = 10 + Math.floor(Math.random() * 11);
      ctx.font = '20px Arial';
      ctx.fillStyle = '#333';
      let y = 120;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      // Letter header
      ctx.font = 'bold 26px Arial';
      ctx.fillText('Dear Sir or Madam,', 60, y);
      y += 40;
      ctx.font = '20px Arial';
      let sentencesLeft = sentenceCount;
      while (sentencesLeft > 0) {
        const paraLen = Math.min(sentencesLeft, 3 + Math.floor(Math.random() * 4)); // 3-6 per paragraph
        let paraSentences = [];
        for (let i = 0; i < paraLen; i++) {
          let s = sentences[Math.floor(Math.random() * sentences.length)];
          // Split sentence into lines of max 70 chars
          while (s.length > 70) {
            let idx = s.lastIndexOf(' ', 70);
            if (idx === -1) idx = 70;
            paraSentences.push(s.slice(0, idx));
            s = s.slice(idx).trim();
          }
          paraSentences.push(s);
        }
        for (const line of paraSentences) {
          ctx.fillText(line, 60, y);
          y += 28;
        }
        y += 12; // space between paragraphs
        sentencesLeft -= paraLen;
      }
      // Letter closing
      y += 20;
      ctx.font = '20px Arial';
      ctx.fillText('Sincerely,', 60, y);
      y += 32;
      ctx.font = 'bold 20px Arial';
      ctx.fillText('The Zamaqo Team', 60, y);
      // Draw Zamaqo logo
      await new Promise((resolve) => {
        const logo = new Image();
        logo.src = 'icons/zamaqo_logo_large_1568x562_54KB.png';
        logo.onload = function() {
          const maxLogoWidth = 120;
          const maxLogoHeight = 40;
          let logoWidth = logo.width;
          let logoHeight = logo.height;
          const widthRatio = maxLogoWidth / logoWidth;
          const heightRatio = maxLogoHeight / logoHeight;
          const scale = Math.min(widthRatio, heightRatio);
          logoWidth *= scale;
          logoHeight *= scale;
          ctx.drawImage(logo, canvas.width - logoWidth - 20, 20, logoWidth, logoHeight);
          resolve();
        };
        logo.onerror = resolve;
      });
      const fieldsHtml = `<b>Random Document</b><br><b>Serial:</b> ${serialNumber}`;
      const filename = `zamaqo_sample_${docType}_${currentDateTime.replace(/:/g, '-')}${serialInFilename ? '_'+serialNumber : ''}.png`;
      return {canvas, filename, fieldsHtml, isTextPdf: true, textContent: generateRandomDocumentText(sentences, serialNumber)};
    }
    case 'largefile': {
      canvas.width = 794; // A4 width at 72dpi
      canvas.height = 1123; // A4 height at 72dpi
      // Just create a blank white canvas - no content needed for large file generation
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const fieldsHtml = `<b>Large File Generator</b><br><b>Serial:</b> ${serialNumber}<br><b>Use the "Download PDF" button with target file size to generate large PDF</b>`;
      const filename = `zamaqo_sample_${docType}_${currentDateTime.replace(/:/g, '-')}${serialInFilename ? '_'+serialNumber : ''}.png`;
      return {canvas, filename, fieldsHtml};
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#1a237e';
  ctx.fillText(`Generated: ${currentDateTime}`, 20, 40);
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#000000';
  ctx.fillText(docType.charAt(0).toUpperCase() + docType.slice(1), 20, 80);
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#1565c0';
  ctx.fillText(`Serial: ${serialNumber}`, 20, canvas.height - 30);
  // Other doc types...
  ctx.font = '16px Arial';
  switch(docType) {
    case 'passport':
      ctx.fillText('Sample Passport', 20, 120);
      ctx.fillText('Passport No: P12345678', 20, 150);
      ctx.fillText('Nationality: Sample Country', 20, 180);
      break;
    case 'wine':
      ctx.fillText('Sample Wine Bottle', 20, 120);
      ctx.fillText('Vintage: 2020', 20, 150);
      ctx.fillText('Region: Sample Region', 20, 180);
      break;
    case 'divelog':
      ctx.fillText('Sample Dive Log', 20, 120);
      ctx.fillText('Dive Site: Sample Location', 20, 150);
      ctx.fillText('Depth: 30m', 20, 180);
      break;
  }
  // Draw Zamaqo logo
  await new Promise((resolve) => {
    const logo = new Image();
    logo.src = 'icons/zamaqo_logo_large_1568x562_54KB.png';
    logo.onload = function() {
      const maxLogoWidth = 150;
      const maxLogoHeight = 60;
      let logoWidth = logo.width;
      let logoHeight = logo.height;
      const widthRatio = maxLogoWidth / logoWidth;
      const heightRatio = maxLogoHeight / logoHeight;
      const scale = Math.min(widthRatio, heightRatio);
      logoWidth *= scale;
      logoHeight *= scale;
      ctx.drawImage(logo, canvas.width - logoWidth - 20, 20, logoWidth, logoHeight);
      resolve();
    };
    logo.onerror = resolve;
  });
  const fieldsHtml = '<i>No fields available for this document type.</i>';
  const filename = `zamaqo_sample_${docType}_${currentDateTime.replace(/:/g, '-')}${serialInFilename ? '_'+serialNumber : ''}.png`;
  return {canvas, filename, fieldsHtml};
}

function generateRandomDocumentText(sentences, serialNumber) {
  // Generate the same text content that was used for the canvas
  const sentenceCount = 10 + Math.floor(Math.random() * 11);
  let textContent = '';
  
  let sentencesLeft = sentenceCount;
  while (sentencesLeft > 0) {
    const paraLen = Math.min(sentencesLeft, 3 + Math.floor(Math.random() * 4)); // 3-6 per paragraph
    for (let i = 0; i < paraLen; i++) {
      let s = sentences[Math.floor(Math.random() * sentences.length)];
      textContent += s + ' ';
    }
    textContent += '\n\n'; // Add paragraph breaks
    sentencesLeft -= paraLen;
  }
  
  return textContent.trim();
}

async function generateRandomDocumentPdf(options = {}, filename) {
  const { jsPDF } = window.jspdf;
  filename = filename || 'randomdoc.pdf';
  
  // Default options
  const defaultOptions = {
    pageCount: 1,
    includeRandomImages: false,
    textOnly: true
  };
  const opts = { ...defaultOptions, ...options };
  
  // Get the text content from the last generation
  const textContent = window.lastTextContent || generateRandomDocumentText([], '');
  
  if (opts.textOnly) {
    // Generate text-based PDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.setFont('helvetica');
    pdf.setFontSize(12);
    const lineHeight = 7;
    const maxWidth = 170;
    const linesPerPage = Math.floor((250 - 50) / lineHeight); // y: 50 to 250
    for (let page = 1; page <= opts.pageCount; page++) {
      if (page > 1) {
        pdf.addPage();
      }
      // Add logo to each page (top-right corner)
      try {
        const logoImg = await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.src = 'icons/zamaqo_logo_small_4kb.gif';
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
        // Place logo at top-right, max width 40mm, max height 15mm
        pdf.addImage(logoImg, 'GIF', 160, 10, 40, 15);
      } catch (e) { /* ignore logo errors */ }
      // Add header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dear Sir or Madam,', 20, 30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      // Generate unique random text for this page
      const pageText = generateRandomDocumentText(window.randomDocSentences || [], window.lastSerialNumber || '');
      const lines = pdf.splitTextToSize(pageText, maxWidth);
      let y = 50;
      let lineIndex = 0;
      for (let i = 0; i < linesPerPage && lineIndex < lines.length; i++) {
        pdf.text(lines[lineIndex], 20, y);
        y += lineHeight;
        lineIndex++;
      }
      // Fill with blank lines if needed
      while (y <= 250 && (page < opts.pageCount || lineIndex >= lines.length)) {
        pdf.text(' ', 20, y);
        y += lineHeight;
      }
      // Add closing on last page
      if (page === opts.pageCount) {
        y += 10;
        pdf.text('Sincerely,', 20, y);
        y += lineHeight * 2;
        pdf.setFont('helvetica', 'bold');
        pdf.text('The Zamaqo Team', 20, y);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Serial: ${window.lastSerialNumber || ''}`, 20, 280);
      }
      // Add disclaimer at the bottom of each page
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(68,68,68);
      pdf.text('This document is used for testing purpose and contains generated sample data from random text generators.', 105, 290, {align: 'center'});
      pdf.setTextColor(0,0,0);
    }
    pdf.save(filename.replace(/\.png$/, '.pdf'));
  } else {
    // Generate PDF with images and multiple pages
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let page = 1; page <= opts.pageCount; page++) {
      if (page > 1) {
        pdf.addPage();
      }
      // Add text content
      pdf.setFont('helvetica');
      pdf.setFontSize(12);
      if (page === 1) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Dear Sir or Madam,', 20, 30);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
      }
      let y = page === 1 ? 50 : 30;
      const lineHeight = 7;
      const maxWidth = 170;
      // Generate unique random text for this page
      const pageText = generateRandomDocumentText(window.randomDocSentences || [], window.lastSerialNumber || '');
      const lines = pdf.splitTextToSize(pageText, maxWidth);
      // Add random images and get their bounding boxes
      let imageBoxes = [];
      if (opts.includeRandomImages) {
        imageBoxes = await addRandomImagesToPage(pdf, page, true); // pass true to get bounding boxes
      }
      // Newspaper-style text wrapping
      for (let i = 0; i < lines.length; i++) {
        let x = 20;
        let line = lines[i];
        let availableWidth = maxWidth;
        // Check for image overlap at this y
        for (const box of imageBoxes) {
          if (y + lineHeight > box.y && y < box.y + box.h) {
            // Overlaps image, move x to right of image and reduce width
            const rightEdge = box.x + box.w + 2;
            if (rightEdge > x) {
              availableWidth = 190 - rightEdge;
              x = rightEdge;
              // If not enough space, skip to below the image
              if (availableWidth < 40) {
                y = box.y + box.h + 2;
                x = 20;
                availableWidth = maxWidth;
              }
            }
          }
        }
        // Split line if too long for available width
        let splitLines = pdf.splitTextToSize(line, availableWidth);
        for (let s = 0; s < splitLines.length; s++) {
          pdf.text(splitLines[s], x, y);
          y += lineHeight;
        }
      }
      // Add closing on last page
      if (page === opts.pageCount) {
        y += 10;
        pdf.text('Sincerely,', 20, y);
        y += lineHeight * 2;
        pdf.setFont('helvetica', 'bold');
        pdf.text('The Zamaqo Team', 20, y);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Serial: ${window.lastSerialNumber || ''}`, 20, 280);
      }
      // Add disclaimer at the bottom of each page
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(68,68,68);
      pdf.text('This document is used for testing purpose and contains generated sample data from random text generators.', 105, 290, {align: 'center'});
      pdf.setTextColor(0,0,0);
    }
    
    pdf.save(filename.replace(/\.png$/, '.pdf'));
  }
}

async function addRandomImagesToPage(pdf, pageNumber, returnBoxes = false) {
  const imageCount = 2 + Math.floor(Math.random() * 3); // 2-4 images per page
  let boxes = [];
  for (let i = 0; i < imageCount; i++) {
    try {
      const x = 20 + Math.random() * 150;
      const y = 50 + Math.random() * 200;
      const size = 20 + Math.random() * 30;
      const shapeType = Math.floor(Math.random() * 3);
      if (shapeType === 0) {
        pdf.setDrawColor(100 + Math.random() * 155, 100 + Math.random() * 155, 100 + Math.random() * 155);
        pdf.setFillColor(200 + Math.random() * 55, 200 + Math.random() * 55, 200 + Math.random() * 55);
        pdf.circle(x + size/2, y + size/2, size/2, 'F');
        if (returnBoxes) boxes.push({x, y, w: size, h: size});
      } else if (shapeType === 1) {
        pdf.setDrawColor(100 + Math.random() * 155, 100 + Math.random() * 155, 100 + Math.random() * 155);
        pdf.setFillColor(200 + Math.random() * 55, 200 + Math.random() * 55, 200 + Math.random() * 55);
        pdf.rect(x, y, size, size, 'F');
        if (returnBoxes) boxes.push({x, y, w: size, h: size});
      } else {
        pdf.setDrawColor(100 + Math.random() * 155, 100 + Math.random() * 155, 100 + Math.random() * 155);
        pdf.setFillColor(200 + Math.random() * 55, 200 + Math.random() * 55, 200 + Math.random() * 55);
        pdf.rect(x, y, size, size/2, 'F');
        if (returnBoxes) boxes.push({x, y, w: size, h: size/2});
      }
    } catch (error) {
      console.log('Error adding random image:', error);
    }
  }
  return boxes;
}

function getFormattedDateTime() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
} 