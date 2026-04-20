import * as vscode from "vscode";
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "ai-code-reviewer" is now active!',
  );

  let disposable = vscode.commands.registerCommand(
    "code-review.analyze",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const document = editor.document;
      const codeContent = document.getText();
      const fileName =
        document.fileName.split("\\").pop()?.split("/").pop() || "untitled";
      const language = document.languageId;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Analyzing Code...",
          cancellable: false,
        },
        async (progress) => {
          try {
            const response = await axios.post(
              "http://127.0.0.1:8000/api/analyze/",
              {
                code_content: codeContent,
                file_name: fileName,
                language: language,
              },
            );

            const issues = response.data.results;
            const issueCount = issues.length;

            if (issueCount === 0) {
              vscode.window.showInformationMessage(
                "No issues found! Great job.",
              );
            } else {
              const selection = await vscode.window.showWarningMessage(
                `Found ${issueCount} issues in your code.`,
                "View Dashboard",
              );

              if (selection === "View Dashboard") {
                const analysisId = response.data.id;
                vscode.env.openExternal(
                  vscode.Uri.parse(`http://localhost:5173/dashboard?id=${analysisId}`),
                );
              }

              // Display diagnostics (Optional: simpler for now just to show message)
              // In a full implementation, we'd add diagnostics here.
              const collection =
                vscode.languages.createDiagnosticCollection("ai-code-reviewer");
              const diagnostics: vscode.Diagnostic[] = [];

              issues.forEach((issue: any) => {
                if (issue.line_number) {
                  const range = new vscode.Range(
                    issue.line_number - 1,
                    0,
                    issue.line_number - 1,
                    100,
                  );
                  const diagnostic = new vscode.Diagnostic(
                    range,
                    `${issue.issue_type}: ${issue.message}\nSuggestion: ${issue.suggestion}`,
                    issue.severity === "CRITICAL"
                      ? vscode.DiagnosticSeverity.Error
                      : issue.severity === "HIGH"
                        ? vscode.DiagnosticSeverity.Error
                        : issue.severity === "MEDIUM"
                          ? vscode.DiagnosticSeverity.Warning
                          : vscode.DiagnosticSeverity.Information,
                  );
                  diagnostics.push(diagnostic);
                }
              });
              collection.set(document.uri, diagnostics);
            }
          } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Error analyzing code: " + error);
          }
        },
      );
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
