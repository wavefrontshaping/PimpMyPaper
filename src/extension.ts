import * as vscode from 'vscode';
import OpenAI from 'openai';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.pimpMyPaper', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			const originalText = document.getText(selection);

			// Fetch the custom prompt from settings
			const customPrompt = vscode.workspace.getConfiguration('pimpMyPaper').get('customPrompt', '');

			// Fetch the API key from settings
			const apiKey = vscode.workspace.getConfiguration('pimpMyPaper').get('apiKey', '');

			// Fetch the model from settings
			const model = vscode.workspace.getConfiguration('pimpMyPaper').get('model', 'gpt-3.5-turbo');

			const keep_old = vscode.workspace.getConfiguration('pimpMyPaper').get('keepOld', true);

			console.log('Pimping your paper...')
			console.log(customPrompt);
			console.log(apiKey);
			console.log(model);
			console.log('keep old: ' + keep_old);
			console.log('Original text: ' + originalText);

			const openai = new OpenAI({
				apiKey: apiKey,
			});

			async function get_response(text: string, model: string) {
				console.log('here')
				const params: OpenAI.Chat.ChatCompletionCreateParams = {
					messages: [{ role: 'user', content: text }],
					model: model,
				};
				const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
				console.log('still here')
				const response = chatCompletion.choices[0]?.message?.content;
				if (response) {
					return response;
				} else {
					return 'No response';
				}
			}

			var new_text = '';
			try {
				new_text = await get_response(customPrompt + '\n' + originalText, model);
				// Handle the response
			} catch (error) {
				console.error("Error calling OpenAI API:", error);
				new_text = 'No response'
			}



			console.log('Chat completion: ' + new_text);

			// Comment the original text and insert the improved text
			const prefix_text = '%%%%%%%%% ORIGINAL TEXT %%%%%%%%%\n';
			const inter_text = '\n%%%%%%%%% PIMPED TEXT %%%%%%%%%\n';
			const suffix_text = '\n%%%%%%%%% END PIMPED TEXT %%%%%%%%%\n';
			editor.edit(editBuilder => {
				const commentedOriginalText = originalText.split('\n').map(line => `% ${line}`).join('\n');
				var finalText = '';
				if (keep_old === true) {
					console.log('Keeping old text');
					finalText = `${prefix_text}${commentedOriginalText}${inter_text}${new_text}${suffix_text}`;
				} else {
					console.log('Not keeping old text');
					finalText = `${inter_text}${new_text}${suffix_text}`;
				}
				editBuilder.replace(selection, finalText);
			});
		}
	});

	context.subscriptions.push(disposable);
}
