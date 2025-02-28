import type { Monaco } from '@monaco-editor/loader';
import type { editor as MonacoEditor } from 'monaco-editor';

export async function initializeEditor(container: HTMLDivElement): Promise<{
	monaco: Monaco;
	editor: MonacoEditor.IStandaloneCodeEditor;
}> {
	const monaco = await import('@monaco-editor/loader');
	const monacoInstance = await monaco.default.init();

	const editor = monacoInstance.editor.create(container, {
		language: 'javascript',
		theme: 'vs-dark',
		automaticLayout: true,
		fontFamily: 'dm mono',
		minimap: {
			enabled: false
		},
		fontSize: window.innerWidth < 480 ? 11 : 13,
		scrollBeyondLastLine: false,
		roundedSelection: false,
		padding: {
			top: 10
		}
	});

	return { monaco: monacoInstance, editor };
}

export function updateEditorFontSize(editor: MonacoEditor.IStandaloneCodeEditor | null) {
	if (editor) {
		editor.updateOptions({
			fontSize: window.innerWidth < 480 ? 12 : 14
		});
	}
}
