'use babel';

import { CompositeDisposable } from 'atom';

export default {
	config: {
		cursor: {
			title: 'Move cursor with semicolon',
			description: 'Turn this off to keep the cursor where it was',
			type: 'boolean',
			default: true
		}
	},

	activate() {
		this.subscriptions = new CompositeDisposable();
		atom.workspace.observeTextEditors((editor) => {
			const willInsert = editor.onWillInsertText(({ cancel, text }) => {
				if (text === ';' && !editor.hasMultipleCursors()) {
					this.check(editor, cancel);
				}
			});

			this.subscriptions.add(willInsert);
		});
	},

	deactivate() {
		this.subscriptions.dispose();
	},

	check(editor, cancel) {
		const position = editor.getCursorBufferPosition();

		// Skip if inside a string
		const scopes = editor.scopeDescriptorForBufferPosition(position).getScopesArray();
		if (scopes.some((scope) => scope.startsWith('string.'))) {
			return;
		}

		// Skip if within a for, if, switch, or while
		const preceedingRange = [[position.row, 0], position];
		const preceedingText = editor.getTextInBufferRange(preceedingRange);
		if (preceedingText.match(/\b(for(each)?|if|switch|while)\s*\(/)) {
			return;
		}

		const followingRange = editor.clipBufferRange([position, [position.row, Infinity]]);
		const followingText = editor.getTextInBufferRange(followingRange);

		// Skip if the line already ends with a semicolon
		if (followingText.charAt(followingText.length - 1) === ';') {
			return;
		}

		// Skip unless the next non-whitespace character is a bracket
		const result = /^([\s\)\]}]+)/.exec(followingText);
		if (result) {
			const endColumn = position.column + result[0].length + result.index;
			const endPosition = [position.row, endColumn];

			// Insert the semicolon ourselves in the current position
			cancel();
			editor.setTextInBufferRange([position, position], ';');

			// Set a checkpoint so hitting undo will move the semicolon back,
			// then remove it, move to the end, and insert the final one.
			const checkpoint = editor.createCheckpoint();
			editor.backspace();

			if (atom.config.get('atom-auto-semicolon.cursor') !== false) {
				editor.setCursorBufferPosition(endPosition);
			}

			editor.setTextInBufferRange([endPosition, endPosition], ';');
			editor.groupChangesSinceCheckpoint(checkpoint);
		}
	}
};
