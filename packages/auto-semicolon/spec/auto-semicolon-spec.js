'use babel';

/* eslint-env jasmine */
/* eslint-env atomtest */

describe('AutoSemicolon', () => {
	let editor = null;

	const runTests = (tests) => {
		tests.forEach((test) => {
			const [initial, final] = test.split(/\s+->\s+/);

			const startingCursorPosition = initial.indexOf('|');
			const endingCursorPosition = final.indexOf('|');

			editor.setText(initial.replace(/\|/g, ''));
			editor.setCursorBufferPosition([0, startingCursorPosition]);
			editor.insertText(';');

			expect(editor.getText()).toEqual(final.replace(/\|/g, ''));
			expect(editor.getCursorBufferPosition().column).toEqual(endingCursorPosition);
		});
	};

	beforeEach(() => {
		waitsForPromise(() => {
			return atom.packages.activatePackage('language-javascript');
		});

		waitsForPromise(() => {
			return atom.packages.activatePackage('auto-semicolon');
		});

		waitsForPromise(() => {
			return atom.workspace.open('test.js').then((theEditor) => {
				editor = theEditor;
			});
		});
	});

	describe('when typing a semicolon before a closing bracket', () => {
		it('moves to the semicolon point', () => {
			return runs(() => {
				atom.config.set('atom-auto-semicolon.cursor', true);

				runTests([
					'foo(|)  ->  foo();|',
					'foo( | )  ->  foo(  );|',
					'foo( |	)  ->  foo( 	);|',
					'foo(bar(|))  ->  foo(bar());|',
					'foo(bar(  | )   )  ->  foo(bar(   )   );|',
					'for (|)  ->  for (;|)',
					'if (|)  ->  if (;|)',
					'switch (|)  ->  switch (;|)',
					'while (|)  ->  while (;|)',
					"console.log('inside if'|)  ->  console.log('inside if');|",
					"console.log('before this'|)  ->  console.log('before this');|",
					'switchQualityUp(|)  ->  switchQualityUp();|',
					'forecast(|)  ->  forecast();|',
					"var foo = { bar: 'bla'|}  ->  var foo = { bar: 'bla'};|",
					"var foo = { bar: 'bla'| }  ->  var foo = { bar: 'bla' };|",
					"track.dispatchEvent('cuechange')|);  ->  track.dispatchEvent('cuechange');|);"
				]);
			});
		});

		it('stays at the cursor position', () => {
			return runs(() => {
				atom.config.set('atom-auto-semicolon.cursor', false);

				runTests([
					'foo(|)  ->  foo(|);',
					'foo( | )  ->  foo( | );',
					'foo( |	)  ->  foo( |	);',
					'foo(bar(|))  ->  foo(bar(|));',
					'foo(bar(  | )   )  ->  foo(bar(  | )   );',
					'for (|)  ->  for (;|)',
					'if (|)  ->  if (;|)',
					'switch (|)  ->  switch (;|)',
					'while (|)  ->  while (;|)',
					"console.log('inside if'|)  ->  console.log('inside if'|);",
					"console.log('before this'|)  ->  console.log('before this'|);",
					'switchQualityUp(|)  ->  switchQualityUp(|);',
					'forecast(|)  ->  forecast(|);',
					"var foo = { bar: 'bla'|}  ->  var foo = { bar: 'bla'|};",
					"var foo = { bar: 'bla'| }  ->  var foo = { bar: 'bla'| };",
					"track.dispatchEvent('cuechange')|);  ->  track.dispatchEvent('cuechange');|);"
				]);
			});
		});

		it('does nothing when inside a string', () => {
			return runs(() => {
				atom.config.set('atom-auto-semicolon.cursor', false);

				runTests([
					"foo(bar('|'))  ->  foo(bar(';|'))",
					'var thing = "(|)"  ->  var thing = "(;|)"',
					"console.log('foo(|)'); -> console.log('foo(;|)');"
				]);
			});
		});
	});
});
