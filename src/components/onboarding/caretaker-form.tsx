"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

const caretakerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email (e.g., name@example.com)." }),
  phone: z.string(), // Removed strict validation
});

const formSchema = z.object({
  caretakers: z
    .array(caretakerSchema)
    .min(1, "You must add at least one caretaker."),
});

type CaretakerFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  defaultValues?: { email: string; phone: string }[];
};

export function CaretakerForm({ onSubmit, defaultValues }: CaretakerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caretakers: defaultValues || [{ email: "", phone: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "caretakers",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col md:flex-row gap-4 items-start p-4 border rounded-lg relative"
            >
              <div className="grid md:grid-cols-2 gap-4 flex-1 w-full">
                <FormField
                  control={form.control}
                  name={`caretakers.${index}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caretaker Email</FormLabel>
                      <FormControl>
                        <Input placeholder="caretaker@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`caretakers.${index}.phone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caretaker Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive md:mt-8"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ email: "", phone: "" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Another Caretaker
          </Button>
          <Button type="submit">Next Step</Button>
        </div>
      </form>
    </Form>
  );
}
