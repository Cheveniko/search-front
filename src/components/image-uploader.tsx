/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

type RetrievedImage = {
  source: string;
  label: string;
};

export const ImageUploader: React.FC = () => {
  const [preview, setPreview] = React.useState<string | ArrayBuffer | null>("");
  const [images, setImages] = React.useState<RetrievedImage[]>([]);

  const formSchema = z.object({
    image: z
      //Rest of validations done via react dropzone
      .instanceof(File)
      .refine((file) => file.size !== 0, "Please upload an image"),
    neighbors: z.coerce
      .number({ invalid_type_error: "Solo se pueden ingresar números" })
      .int()
      .positive("Debes recuperar al menos una imagen")
      .max(20, "Solo se pueden recuperar hasta 20 imágenes"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      image: new File([""], "filename"),
      neighbors: 5,
    },
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const reader = new FileReader();
      try {
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(acceptedFiles[0]);
        form.setValue("image", acceptedFiles[0]);
        form.clearErrors("image");
      } catch (error) {
        setPreview(null);
        form.resetField("image");
      }
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      maxSize: 5000000,
      accept: { "image/png": [], "image/jpg": [], "image/jpeg": [] },
    });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append("image", values.image);
    formData.append("neighbors", values.neighbors.toString());

    try {
      const response = await fetch("http://localhost:8000/images", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      setImages(data.images);
    } catch (error) {
      console.log(error);
    }

    toast.success(
      "Imagen subida exitosamente, desliza para ver los resultados!",
    );
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="image"
            render={() => (
              <FormItem className="mx-auto md:w-1/2">
                <FormLabel
                  className={`${
                    fileRejections.length !== 0 && "text-destructive"
                  }`}
                >
                  <h2 className="text-xl font-semibold tracking-tight">
                    Sube una imagen
                    <span
                      className={
                        form.formState.errors.image ||
                        fileRejections.length !== 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    ></span>
                  </h2>
                </FormLabel>
                <FormControl>
                  <div
                    {...getRootProps()}
                    className="mx-auto flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border border-foreground p-8 shadow-sm shadow-foreground sm:h-[400px]"
                  >
                    {preview && (
                      <img
                        src={preview as string}
                        alt="Uploaded image"
                        className="max-h-[300px] rounded-lg"
                      />
                    )}
                    <ImagePlus
                      className={`size-40 ${preview ? "hidden" : "block"}`}
                    />
                    <Input {...getInputProps()} type="file" />
                    {isDragActive ? (
                      <p>Suelta la imagen!</p>
                    ) : (
                      <p>Da click aquí o arrastra una imagen para subirla</p>
                    )}
                  </div>
                </FormControl>
                <FormMessage>
                  {fileRejections.length !== 0 && (
                    <p>
                      La imagen debe ser menor a 5MB y de tipo png, jpg, o jpeg
                    </p>
                  )}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neighbors"
            render={({ field }) => (
              <FormItem className="text-center">
                <FormLabel className="text-base">
                  Número de imágenes a recuperar
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="mx-auto w-1/3 border-foreground bg-transparent shadow-md focus-visible:ring-offset-0 md:w-1/12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mx-auto block h-auto rounded-lg px-8 py-3 text-xl"
          >
            Buscar
          </Button>
        </form>
      </Form>
      {images.length !== 0 && (
        <div className="space-y-4">
          <h3 className="text-3xl font-bold text-primary">Resultados</h3>
          <div className="flex flex-wrap items-center justify-around gap-4">
            {images.map((image, index) => (
              <div key={index} className="space-y-2">
                <p>{`${index + 1}. ${image.label}`}</p>
                <img
                  src={image.source}
                  alt={image.label}
                  className="max-w-[300px] rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
