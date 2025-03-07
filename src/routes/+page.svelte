<script lang="ts">
	import { onMount } from 'svelte';
	import '@monaco-editor/loader';
	import type { Monaco } from '@monaco-editor/loader';
	import type { editor as MonacoEditor } from 'monaco-editor';
	import { overrideConsole } from '$lib/console';
	import { initializeEditor, updateEditorFontSize } from '$lib/editor';
	import { encode } from '$lib/sharing';
	import '@fontsource/dm-mono';

	let editorContainer: HTMLDivElement;
	let terminal: HTMLDivElement;
	let executionTimeElement: HTMLSpanElement;
	let monacoEditor: Monaco;
	let codeEditor: MonacoEditor.IStandaloneCodeEditor;
	let isLoadingPackages = false;
	let pendingCode = '';

	let packages = $state<string[]>([]);

	function checkForImports() {
		const code = codeEditor.getValue();
		const importRegex = /import\s+.+?\s+from\s+['"](.+?)['"];?/g;
		const matches = Array.from(code.matchAll(importRegex));

		const pkgs = matches.map((match) => {
			const importStatement = match[0];
			const packageName = match[1];
			// Extract just the package name (before any path segments)
			return packageName.split('/')[0];
		});

		return [...new Set(pkgs)]; // Remove duplicates
	}

	async function loadPackages(pkgs: string[]): Promise<void> {
		if (pkgs.length === 0) return Promise.resolve();

		isLoadingPackages = true;
		packages = [];

		terminal.innerHTML = `<div class="log">Loading packages: ${pkgs.join(', ')}...</div>`;

		const loadPromises = pkgs.map((pkg) => {
			return new Promise<void>((resolve, reject) => {
				const script = document.createElement('script');
				script.src = `https://unpkg.com/${pkg}`;
				script.type = 'module';

				script.onload = () => {
					console.log(`Loaded ${pkg}`);
					packages.push(pkg);
					resolve();
				};

				script.onerror = () => {
					console.error(`Failed to load ${pkg}`);
					reject(new Error(`Failed to load ${pkg}`));
				};

				document.body.appendChild(script);
			});
		});

		try {
			await Promise.all(loadPromises);
			return Promise.resolve();
		} catch (error) {
			console.error('Error loading packages:', error);
			return Promise.reject(error);
		} finally {
			isLoadingPackages = false;
		}
	}

	async function runCode() {
		if (!codeEditor) return;

		const detectedPackages = checkForImports();
		pendingCode = codeEditor.getValue();

		// Clear terminal first
		terminal.innerHTML = '';
		executionTimeElement.textContent = '';

		// Load packages first if needed
		if (detectedPackages.length > 0) {
			try {
				await loadPackages(detectedPackages);
				executeCode();
			} catch (error: any) {
				console.error('Error loading dependencies:', error.message);
			}
		} else {
			// No packages to load, run immediately
			executeCode();
		}
	}

	function executeCode() {
		let code = pendingCode;

		// Don't comment out imports, but create a module context
		code = `
			try {
				${code}
			} catch (error) {
				console.error('Error executing code:', error.message);
			}
		`;

		const startTime = performance.now();

		try {
			overrideConsole(terminal);
			// Use a dynamic import to execute in module context
			const blob = new Blob([code], { type: 'application/javascript' });
			const url = URL.createObjectURL(blob);

			import(url)
				.catch((error) => {
					console.error('Error executing module:', error.message);
				})
				.finally(() => {
					URL.revokeObjectURL(url);
					const endTime = performance.now();
					const duration = (endTime - startTime).toFixed(2);
					executionTimeElement.textContent = `Execution time: ${duration}ms`;
				});
		} catch (error: any) {
			console.error('Error setting up execution:', error.message);
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

<div class="flex flex-col h-dvh">
	<header
		class="flex flex-wrap gap-2.5 justify-between items-center px-5 py-2.5 bg-nord1 text-nord6"
	>
		<h1 class="font-mono text-2xl">jsGround</h1>
		<div class="flex flex-wrap gap-2.5">
			<button onclick={shareCode} class="btn">Share</button>
			<button onclick={runCode} class="btn">
				Run Code
				<span class="px-1.5 py-0.5 ml-2 text-xs rounded bg-nord2">Ctrl+S / ⌘S</span>
			</button>
			<button onclick={clearTerminal} class="btn bg-nord11!">Clear Terminal</button>
		</div>
	</header>

	<div class="grid h-[calc(100%-4rem)] grid-cols-[1fr_400px] overflow-hidden">
		<div bind:this={editorContainer} class="h-full border-r border-nord3"></div>
		<div class="flex overflow-hidden flex-col h-full bg-nord0 text-nord4">
			<div class="flex justify-between px-4 py-2.5 bg-nord1 text-nord4">
				<span>Terminal Output</span>
			</div>
			<div
				bind:this={terminal}
				class="bg-nord0 **:[.log]:text-nord4 **:[.error]:text-nord11 **:[.warn]:text-nord13 **:[.info]:text-nord8 flex-1 overflow-y-auto px-5 py-2.5 font-mono text-sm whitespace-pre-wrap"
			></div>
			<div class="flex justify-between px-4 py-2.5 text-xs bg-nord1 text-nord4">
				<span>JavaScript Console</span>
				<span bind:this={executionTimeElement}></span>
			</div>
		</div>
	</div>
</div>
