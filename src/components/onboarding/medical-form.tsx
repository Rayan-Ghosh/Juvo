"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  hasConditions: z.enum(["yes", "no"], {
    required_error: "You need to select an option.",
  }),
  details: z.string().optional(),
});

type MedicalFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onBack: () => void;
  defaultValues?: z.infer<typeof formSchema>;
};

export function MedicalForm({ onSubmit, onBack, defaultValues }: MedicalFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const hasConditions = form.watch("hasConditions");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="hasConditions"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base">
                Do you have any medically certified, stress-related conditions?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">Yes</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {hasConditions === "yes" && (
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="If you are comfortable, please share more details."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This information will be kept private and used to provide you with better support.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
        />
        )}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Next Step</Button>
        </div>
      </form>
    </Form>
  );
}
