
import JSZip from "jszip";

/**
 * Extracts text content from a PowerPoint file (.pptx)
 * 
 * PPTX files are just zipped XML files. The slide content is stored in 
 * ppt/slides/slideX.xml files. We extract all text elements (<a:t>) 
 * from these files.
 */
export async function extractTextFromPPTX(file: File): Promise<string> {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    const slides: { id: number; content: string }[] = [];

    // Iterate through all files in the zip
    for (const relativePath in content.files) {
        if (relativePath.startsWith("ppt/slides/slide") && relativePath.endsWith(".xml")) {
            const slideFile = content.files[relativePath];

            // Extract slide number from filename (e.g., "ppt/slides/slide1.xml" -> 1)
            const slideMatch = relativePath.match(/slide(\d+)\.xml/);
            const slideId = slideMatch ? parseInt(slideMatch[1]) : 0;

            const slideXml = await slideFile.async("text");
            const slideText = parseSlideXML(slideXml);

            if (slideText.trim()) {
                slides.push({ id: slideId, content: slideText });
            }
        }
    }

    // Sort slides by ID to maintain order
    slides.sort((a, b) => a.id - b.id);

    return slides.map(s => `[SLIDE ${s.id}]\n${s.content}`).join("\n\n");
}

/**
 * Simple XML parser to extract text from <a:t> tags
 * We treat XML as string to avoid browser DOMParser overhead/issues
 */
function parseSlideXML(xml: string): string {
    // Regex to match <a:t>Content</a:t> or <a:t>Content</a:t>
    // Note: PowerPoint text runs are often split up weirdly, but this is usually sufficient for AI context
    // Regex to match <a:t>, <t>, <p:t> etc. containing text
    // Handles various PowerPoint XML namespaces
    const textMatches = xml.match(/<[\w:]*t[^>]*>([^<]*)<\/[\w:]*t>/g);

    if (!textMatches) return "";

    return textMatches
        .map(tag => {
            // Remove the opening and closing tags to get content
            return tag.replace(/<[\w:]*t[^>]*>/, "").replace(/<\/[\w:]*t>/, "");
        })
        .filter(text => text.trim().length > 0)
        .join(" ");
}
