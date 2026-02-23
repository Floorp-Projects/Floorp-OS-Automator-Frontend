/**
 * TypeScript Syntax Stripper
 * Removes TypeScript-specific syntax from AST and generates plain JavaScript code
 */

import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

/**
 * Remove type annotations from a pattern (identifier, object pattern, array pattern, etc.)
 */
function removeTypeFromPattern(
  pattern: t.PatternLike | t.LVal | t.TSParameterProperty,
): void {
  if ((pattern as t.TSParameterProperty).type === "TSParameterProperty") {
    return;
  }
  if ((pattern as t.Identifier).type === "Identifier") {
    const id = pattern as t.Identifier;
    if (id.typeAnnotation) {
      delete (id as t.Identifier & {
        typeAnnotation?: t.TSTypeAnnotation;
      }).typeAnnotation;
    }
    return;
  }
  if ((pattern as t.AssignmentPattern).type === "AssignmentPattern") {
    const ap = pattern as t.AssignmentPattern;
    removeTypeFromPattern(ap.left);
    return;
  }
  if ((pattern as t.ObjectPattern).type === "ObjectPattern") {
    const op = pattern as t.ObjectPattern;
    op.properties.forEach((prop) => {
      if (prop.type === "ObjectProperty") {
        removeTypeFromPattern(prop.value as t.PatternLike);
      } else if (prop.type === "RestElement") {
        removeTypeFromPattern(prop.argument);
      }
    });
    return;
  }
  if ((pattern as t.ArrayPattern).type === "ArrayPattern") {
    const ap = pattern as t.ArrayPattern;
    ap.elements.forEach((el) => {
      if (!el) return;
      if (el.type === "RestElement") {
        removeTypeFromPattern(el.argument);
      } else if (el.type === "Identifier") {
        if (el.typeAnnotation) {
          delete (el as t.Identifier & {
            typeAnnotation?: t.TSTypeAnnotation;
          }).typeAnnotation;
        }
      } else if (el.type === "AssignmentPattern") {
        removeTypeFromPattern(el.left);
      }
    });
  }
}

/**
 * Strip TypeScript syntax from code and return plain JavaScript
 * Removes type annotations, interfaces, type aliases, enums, etc.
 */
export function stripTypeScriptSyntax(code: string): string {
  if (!code) return "";

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    traverse(ast, {
      TSInterfaceDeclaration(path) {
        path.remove();
      },
      TSTypeAliasDeclaration(path) {
        path.remove();
      },
      TSModuleDeclaration(path) {
        path.remove();
      },
      TSEnumDeclaration(path) {
        path.remove();
      },
      TSImportEqualsDeclaration(path) {
        path.remove();
      },
      TSAsExpression(path) {
        path.replaceWith(path.node.expression as t.Expression);
      },
      TSTypeAssertion(path) {
        path.replaceWith(path.node.expression as t.Expression);
      },
      TSSatisfiesExpression(path) {
        path.replaceWith(path.node.expression as t.Expression);
      },
      Function(path) {
        const n = path.node as
          | t.FunctionDeclaration
          | t.FunctionExpression
          | t.ArrowFunctionExpression
          | t.ObjectMethod
          | t.ClassMethod
          | t.ClassPrivateMethod;

        if (
          (n as
            | t.FunctionDeclaration
            | t.FunctionExpression
            | t.ArrowFunctionExpression).typeParameters
        ) {
          delete (n as t.FunctionDeclaration & {
            typeParameters?: t.TSTypeParameterDeclaration;
          }).typeParameters;
        }

        if (
          (n as
            | t.FunctionDeclaration
            | t.FunctionExpression
            | t.ArrowFunctionExpression).returnType
        ) {
          delete (n as t.FunctionDeclaration & {
            returnType?: t.TSTypeAnnotation;
          }).returnType;
        }

        (n.params ?? []).forEach((p) => {
          if (
            p.type === "Identifier" ||
            p.type === "AssignmentPattern" ||
            p.type === "ObjectPattern" ||
            p.type === "ArrayPattern" ||
            p.type === "RestElement" ||
            p.type === "TSParameterProperty"
          ) {
            removeTypeFromPattern(
              p as t.PatternLike | t.LVal | t.TSParameterProperty,
            );
          }
        });
      },
      ClassProperty(path) {
        const n = path.node as t.ClassProperty;
        if (
          (n as t.ClassProperty & { typeAnnotation?: t.TSTypeAnnotation })
            .typeAnnotation
        ) {
          delete (n as t.ClassProperty & {
            typeAnnotation?: t.TSTypeAnnotation;
          }).typeAnnotation;
        }
        if ((n as t.ClassProperty & { definite?: boolean }).definite) {
          delete (n as t.ClassProperty & { definite?: boolean }).definite;
        }
        if ((n as t.ClassProperty & { declare?: boolean }).declare) {
          delete (n as t.ClassProperty & { declare?: boolean }).declare;
        }
      },
      TSParameterProperty(path) {
        path.replaceWith(
          path.node.parameter as
            | t.Identifier
            | t.AssignmentPattern
            | t.RestElement,
        );
      },
      Identifier(path) {
        const id = path.node as t.Identifier & {
          typeAnnotation?: t.TSTypeAnnotation;
        };
        if (id.typeAnnotation) delete id.typeAnnotation;
      },
      ImportDeclaration(path) {
        const n = path.node as t.ImportDeclaration & {
          importKind?: "type" | "value";
        };
        if (n.importKind === "type") {
          path.remove();
          return;
        }
        if (n.specifiers && n.specifiers.length) {
          n.specifiers = n.specifiers.filter(
            (s) =>
              (s as t.ImportSpecifier & { importKind?: "type" | "value" })
                .importKind !== "type",
          );
          if (n.specifiers.length === 0) path.remove();
        }
      },
      ExportNamedDeclaration(path) {
        const n = path.node as t.ExportNamedDeclaration & {
          exportKind?: "type" | "value";
        };
        if (n.exportKind === "type") {
          path.remove();
        }
      },
    });

    const generator =
      ((generate as unknown) as { default?: typeof generate }).default ??
        generate;

    const { code: jsCode } = generator(ast, {
      comments: true,
      compact: false,
      concise: false,
      retainLines: false,
      retainFunctionParens: true,
    });

    return jsCode as string;
  } catch {
    return code;
  }
}
