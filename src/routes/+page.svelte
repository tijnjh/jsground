<script lang="ts">
	import { onMount } from 'svelte';
	import '@monaco-editor/loader';
	import type { Monaco } from '@monaco-editor/loader';
	import type { editor as MonacoEditor } from 'monaco-editor';
	import { overrideConsole } from '$lib/console';
	import { initializeEditor, updateEditorFontSize } from '$lib/editor';
	import { encode } from '$lib/sharing';

	let editorContainer: HTMLDivElement;
	let terminal: HTMLDivElement;
	let executionTimeElement: HTMLSpanElement;
	let monacoEditor: Monaco;
	let codeEditor: MonacoEditor.IStandaloneCodeEditor;

	function runCode() {
		if (!codeEditor) return;

		terminal.innerHTML = '';
		const code = codeEditor.getValue();
		const startTime = performance.now();

		try {
			overrideConsole(terminal);
			const executeCode = new Function(code);
			executeCode();
		} catch (error: any) {
			console.error('Error executing code:', error.message);
		} finally {
			const endTime = performance.now();
			const duration = (endTime - startTime).toFixed(2);
			executionTimeElement.textContent = `Execution time: ${duration}ms`;
		}
	}

	function clearTerminal() {
		if (terminal) {
			terminal.innerHTML = '';
			executionTimeElement.textContent = '';
		}
	}

	function shareCode() {
		if (codeEditor) {
			const encodedCode = encode(codeEditor.getValue());
			// todo: make ts (this) url relative
			const url = `https://jsground.jonas.zone/s/${encodedCode}`;
			navigator.clipboard.writeText(url);
			alert('copied url to clipboard');
		}
	}

	onMount(async () => {
		const { monaco, editor } = await initializeEditor(editorContainer);
		monacoEditor = monaco;
		codeEditor = editor;

		codeEditor.addCommand(monacoEditor.KeyMod.CtrlCmd | monacoEditor.KeyCode.KeyS, runCode);

		if (localStorage.code) {
			codeEditor.setValue(localStorage.code);
		}
	});
</script>

<svelte:window
	onkeydown={(e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
		}
	}}
	onresize={() => updateEditorFontSize(codeEditor)}
/>

<div class="flex h-dvh flex-col">
	<header
		class="bg-nord1 text-nord6 flex flex-wrap items-center justify-between gap-2.5 px-5 py-2.5"
	>
		<h1 class="font-mono text-2xl">jsGround</h1>
		<div class="flex flex-wrap gap-2.5">
			<button onclick={shareCode} class="btn">Share</button>
			<button onclick={runCode} class="btn">
				Run Code
				<span class="bg-nord2 ml-2 rounded px-1.5 py-0.5 text-xs">Ctrl+S / ⌘S</span>
			</button>
			<button onclick={clearTerminal} class="btn bg-nord11!">Clear Terminal</button>
		</div>
	</header>

	<div class="grid h-[calc(100%-4rem)] grid-cols-[1fr_400px] overflow-hidden">
		<div bind:this={editorContainer} class="border-nord3 h-full border-r"></div>
		<div class="bg-nord0 text-nord4 flex h-full flex-col overflow-hidden">
			<div class="bg-nord1 text-nord4 flex justify-between px-4 py-2.5">
				<span>Terminal Output</span>
			</div>
			<div
				bind:this={terminal}
				class="bg-nord0 **:[.log]:text-nord4 **:[.error]:text-nord11 **:[.warn]:text-nord13 **:[.info]:text-nord8 flex-1 overflow-y-auto px-5 py-2.5 font-mono text-sm whitespace-pre-wrap"
			></div>
			<div class="bg-nord1 text-nord4 flex justify-between px-4 py-2.5 text-xs">
				<span>JavaScript Console</span>
				<span bind:this={executionTimeElement}></span>
			</div>
		</div>
	</div>
</div>
