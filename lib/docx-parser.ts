import JSZip from "jszip";

/**
 * Extracts text content from a Word Document file (.docx)
 * 
 * DOCX files are zipped XML files. The main document content is stored in 
 * word/document.xml. We extract all text elements (<w:t>) from it, 
 * maintaining paragraph breaks.
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    const docFile = content.file("word/document.xml");
    if (!docFile) {
        throw new Error("File DOCX tidak valid: word/document.xml tidak ditemukan.");
    }

    const docXml = await docFile.async("text");
    return parseDocxXML(docXml);
}

/**
 * Simple XML parser to extract text from <w:t> tags while preserving paragraphs (<w:p>)
 * We treat XML as string to avoid browser DOMParser overhead/issues
 */
function parseDocxXML(xml: string): string {
    // Match all paragraphs (<w:p>...</w:p>)
    const paragraphMatches = xml.match(/<w:p[^>]*>([\s\S]*?)<\/w:p>/g);
    
    if (!paragraphMatches) {
        // Fallback: search for any w:t tags directly if paragraphs are not structured normally
        const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (!textMatches) return "";
        return textMatches
            .map(tag => {
                const text = tag.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "");
                return decodeEntities(text);
            })
            .join("");
    }

    const paragraphs: string[] = [];

    for (const pXml of paragraphMatches) {
        // Match all text runs <w:t> within this paragraph
        const textMatches = pXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (textMatches) {
            const pText = textMatches
                .map(tag => {
                    // Extract inner text
                    const match = tag.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
                    const innerText = match ? match[1] : "";
                    return decodeEntities(innerText);
                })
                .join(""); // runs within a paragraph are joined directly
            
            if (pText.trim()) {
                paragraphs.push(pText);
            }
        }
    }

    return paragraphs.join("\n\n");
}

/**
 * Decodes basic HTML XML entities
 */
function decodeEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
