"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { TypingLoader } from "@/components/prompt-kit/loader"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Tool } from "@/components/prompt-kit/tool"
import type { ToolPart } from "@/components/prompt-kit/tool"
import { Badge } from "@/components/shadcnui/badge"
import { Button } from "@/components/shadcnui/button"
import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage, UIMessagePart } from "ai"
import {
  AlertTriangle,
  ArrowUp,
  Brain,
  Calendar,
  Copy,
  Database,
  HelpCircle,
  Lightbulb,
  LucideIcon,
  Orbit,
  Sparkles,
} from "lucide-react"
import { memo, useState } from "react"

type MessageComponentProps = {
  message: UIMessage
  isLastMessage: boolean
}

const renderToolPart = (
  part: UIMessagePart<any, any>,
  index: number
): React.ReactNode => {
  if (!part.type?.startsWith("tool-")) return null

  return <Tool key={`${part.type}-${index}`} toolPart={part as ToolPart} />
}

export const MessageComponent = memo(
  ({ message, isLastMessage }: MessageComponentProps) => {
    const isAssistant = message?.role === "assistant"

    const handleCopy = () => {
      const textToCopy = message?.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("")

      navigator.clipboard.writeText(textToCopy)
    }

    return (
      <Message
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-2 px-2 md:px-10",
          isAssistant ? "items-start" : "items-end"
        )}
      >
        {isAssistant ? (
          <div className="group flex w-full flex-col gap-0 space-y-2">
            <div className="w-full">
              {message?.parts
                .filter(
                  (part: any) => part.type && part.type.startsWith("tool-")
                )
                .map((part: any, index: number) => renderToolPart(part, index))}
            </div>
            <MessageContent
              className="prose prose-sm md:prose-base prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs prose-p:mb-2 prose-p:leading-relaxed dark:prose-invert w-full min-w-0 flex-1 rounded-lg bg-transparent p-0 max-w-none"
              markdown
            >
              {message?.parts
                .filter((part: any) => part.type === "text")
                .map((part: any) => part.text)
                .join("")}
            </MessageContent>

            <MessageActions
              className={cn(
                "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                isLastMessage && "opacity-100"
              )}
            >
              <MessageAction tooltip="Copy" delayDuration={100}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={handleCopy}
                >
                  <Copy />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        ) : (
          <div className="group flex w-full flex-col items-end gap-1">
            <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
              {message?.parts
                .map((part: any) => (part.type === "text" ? part.text : null))
                .join("")}
            </MessageContent>
            <MessageActions
              className={cn(
                "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              )}
            >
              <MessageAction tooltip="Copy" delayDuration={100}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={handleCopy}
                >
                  <Copy />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        )}
      </Message>
    )
  }
)

MessageComponent.displayName = "MessageComponent"

const LoadingMessage = memo(() => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-2 md:px-10">
    <div className="group flex w-full flex-col gap-0">
      <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
        <TypingLoader />
      </div>
    </div>
  </Message>
))

LoadingMessage.displayName = "LoadingMessage"

const ErrorMessage = memo(({ error }: { error: Error }) => (
  <Message className="not-prose mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col items-start gap-0">
      <div className="text-primary flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-red-300 bg-red-300/20 px-2 py-1">
        <AlertTriangle size={16} className="text-red-500" />
        <p className="text-red-500">{error.message}</p>
      </div>
    </div>
  </Message>
))

ErrorMessage.displayName = "ErrorMessage"

type SuggestionItem = {
  text: string
  icon?: LucideIcon
  color?: string
  onClick?: () => void
}

export type ToolCallingChatbotProps = {
  apiEndpoint?: string
}

function ToolCallingChatbot({
  apiEndpoint = "/api/chat",
}: ToolCallingChatbotProps) {
  // Hardcoded welcome configurations
  const welcomeTitle = "How can I help you today?"
  const welcomeDescription = "I'm your AI assistant with knowledge management capabilities. Teach me facts or ask me questions!"
  const placeholder = "Ask anything or teach me something..."

  const suggestions: SuggestionItem[] = [
    {
      text: 'Teach me a fact about myself',
      icon: Brain,
      color: 'text-blue-500',
    },
    {
      text: 'What is my favorite color?',
      icon: HelpCircle,
      color: 'text-purple-500',
    },
    {
      text: "What's today's date?",
      icon: Calendar,
      color: 'text-green-500',
    },
    {
      text: 'Show my knowledge base',
      icon: Database,
      color: 'text-orange-500',
    },
    {
      text: 'Give me an idea',
      icon: Lightbulb,
      color: 'text-yellow-500',
    },
  ]

  const [input, setInput] = useState("")

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: apiEndpoint,
    }),
  })

  const handleSubmit = () => {
    if (!input.trim()) return

    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto">
        <ChatContainerContent className="space-y-6 px-4 py-12">
          {messages.length === 0 && (
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-8 px-6 py-12">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 shadow-xs">
                <Orbit className="h-10 w-10" />
              </div>

              {/* Welcome Text */}
              <div className="flex flex-col space-y-2.5 text-center">
                <h3 className="text-xl font-semibold tracking-tight">
                  {welcomeTitle}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {welcomeDescription}
                </p>
              </div>

              {/* Suggestion Badges */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {suggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={cn(
                          "h-8 cursor-pointer gap-1.5 rounded-full px-3 text-xs font-medium transition-all hover:scale-105 hover:shadow-xs",
                          "[&_svg]:size-3.5 [&_svg]:shrink-0"
                        )}
                        onClick={() => {
                          if (suggestion.onClick) {
                            suggestion.onClick()
                          } else {
                            setInput(suggestion.text)
                          }
                        }}
                      >
                        {Icon && (
                          <Icon
                            aria-hidden="true"
                            className={suggestion.color}
                          />
                        )}
                        {suggestion.text}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {messages?.map((message, index) => {
            const isLastMessage = index === messages.length - 1

            return (
              <MessageComponent
                key={message.id}
                message={message}
                isLastMessage={isLastMessage}
              />
            )
          })}

          {status === "submitted" && <LoadingMessage />}
          {status === "error" && error && <ErrorMessage error={error} />}
        </ChatContainerContent>
      </ChatContainerRoot>

      <div className="inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <PromptInput
          isLoading={status !== "ready"}
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-2xs"
        >
          <div className="flex flex-col">
            <PromptInputTextarea
              placeholder={placeholder}
              className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
            />

            <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 p-2">
              <div />
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  disabled={
                    !input.trim() || (status !== "ready" && status !== "error")
                  }
                  onClick={handleSubmit}
                  className="size-9 rounded-full"
                >
                  {status === "ready" || status === "error" ? (
                    <ArrowUp size={18} />
                  ) : (
                    <span className="size-3 rounded-xs bg-white" />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </div>
        </PromptInput>
      </div>
    </div>
  )
}

export default ToolCallingChatbot
