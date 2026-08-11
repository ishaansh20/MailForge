import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Icon } from "./Icon.jsx";
import { cn } from "../../utils/cn.js";

const EDITOR_MODES = {
  VISUAL: "visual",
  HTML: "html",
};

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  children,
  title,
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-stone-950 text-white"
          : "text-stone-600 hover:bg-stone-100",
      )}
    >
      {children}
    </button>
  );
}

function RichTextEditor({
  value,
  onChange,
  error,
  label,
  helperText,
  placeholder,
}) {
  const [mode, setMode] = useState(EDITOR_MODES.VISUAL);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "ems-rich-text-content min-h-[220px] px-4 py-3 text-sm text-stone-950 focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || mode !== EDITOR_MODES.VISUAL) {
      return;
    }

    const currentHtml = editor.getHTML();

    if ((value || "") !== currentHtml) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor, mode]);

  function handleModeChange(nextMode) {
    setMode(nextMode);

    if (nextMode === EDITOR_MODES.VISUAL && editor) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }

  function handleSetLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-white transition focus-within:border-stone-950 focus-within:ring-4 focus-within:ring-stone-950/5",
          error ? "border-rose-300" : "border-stone-200",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out",
                mode === EDITOR_MODES.VISUAL
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-stone-100",
              )}
              onClick={() => handleModeChange(EDITOR_MODES.VISUAL)}
            >
              Visual
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out",
                mode === EDITOR_MODES.HTML
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-stone-100",
              )}
              onClick={() => handleModeChange(EDITOR_MODES.HTML)}
            >
              HTML
            </button>
          </div>

          {mode === EDITOR_MODES.VISUAL ? (
            <div className="flex flex-wrap items-center gap-1">
              <ToolbarButton
                title="Bold"
                active={editor?.isActive("bold")}
                disabled={!editor}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton
                title="Italic"
                active={editor?.isActive("italic")}
                disabled={!editor}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <span className="italic">I</span>
              </ToolbarButton>
              <ToolbarButton
                title="Underline"
                active={editor?.isActive("underline")}
                disabled={!editor}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <span className="underline">U</span>
              </ToolbarButton>
              <ToolbarButton
                title="Heading"
                active={editor?.isActive("heading", { level: 2 })}
                disabled={!editor}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                H2
              </ToolbarButton>

              <span className="mx-1 h-5 w-px bg-stone-200" />

              <ToolbarButton
                title="Bulleted list"
                active={editor?.isActive("bulletList")}
                disabled={!editor}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <Icon name="bulletList" size={16} />
              </ToolbarButton>
              <ToolbarButton
                title="Numbered list"
                active={editor?.isActive("orderedList")}
                disabled={!editor}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <Icon name="orderedList" size={16} />
              </ToolbarButton>
              <ToolbarButton
                title="Link"
                active={editor?.isActive("link")}
                disabled={!editor}
                onClick={handleSetLink}
              >
                <Icon name="link" size={16} />
              </ToolbarButton>

              <span className="mx-1 h-5 w-px bg-stone-200" />

              <ToolbarButton
                title="Undo"
                disabled={!editor?.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Icon name="undo" size={16} />
              </ToolbarButton>
              <ToolbarButton
                title="Redo"
                disabled={!editor?.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Icon name="redo" size={16} />
              </ToolbarButton>
            </div>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Raw HTML source
            </span>
          )}
        </div>

        {mode === EDITOR_MODES.VISUAL ? (
          <EditorContent editor={editor} placeholder={placeholder} />
        ) : (
          <textarea
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="min-h-[220px] w-full resize-y border-0 bg-white px-4 py-3 font-mono text-sm text-stone-950 outline-none placeholder:text-stone-400"
          />
        )}
      </div>

      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-stone-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export { RichTextEditor };
