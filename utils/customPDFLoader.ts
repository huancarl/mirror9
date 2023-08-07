import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders';

export abstract class BufferLoader extends BaseDocumentLoader {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  protected abstract parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]>;

  public async load(): Promise<Document[]> {
    let buffer: Buffer;
    let metadata: Record<string, string>;
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);
      metadata = { source: this.filePathOrBlob };
    } else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}

export class CustomPDFLoader extends BufferLoader {
  public async parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]> {
    const { pdf } = await PDFLoaderImports();
    const parsed = await pdf(raw);

    // Extract the filename from the source
    const sourceFileName = metadata.source.split('/').pop();

    // Here we format the metadata to your desired structure
    const formattedMetadata = {
      source: sourceFileName,
      totalpages: parsed.numpages,
      pageNumber: parsed.pageNumber, // replace this with the actual method to get page number
      year: parsed.year, // replace this with the actual method to get year
    };

    return [
      new Document({
        pageContent: parsed.text,
        metadata: formattedMetadata, // Use the new metadata format
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.',
    );
  }
}

