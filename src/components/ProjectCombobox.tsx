"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/utils/Helpers"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectComboboxProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelect: (project: Project) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ProjectCombobox({
  projects,
  selectedProject,
  onSelect,
  className,
  placeholder = "选择项目...",
  disabled = false
}: ProjectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedProject
            ? selectedProject.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search Project..." />
          <CommandList>
            <CommandEmpty>没有找到项目</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => {
                    onSelect(project)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProject?.id === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    {project.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[230px]">
                        {project.description}
                      </span>
                    )}
                  </div>
                  {project.status && (
                    <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.status === 'open' ? 'bg-green-100 text-green-800' :
                      project.status === 'closed' ? 'bg-red-100 text-red-800' :
                      project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 