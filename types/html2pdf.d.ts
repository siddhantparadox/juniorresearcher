declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: object;
    jsPDF?: object;
    pagebreak?: object;
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    from(element: HTMLElement | string): Html2Pdf;
    save(filename?: string): Promise<void>;
    toPdf(): Html2Pdf;
    outputPdf(): Promise<Uint8Array>;
  }

  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}
