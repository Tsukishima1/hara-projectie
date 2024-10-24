"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DottedSeparator } from "@/components/dotted-seperator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema } from "../schemas";
import { useLogin } from "../api/use-login";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export const SignInCard = () => {
  const { mutate, status, data, isPending } = useLogin();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    // mutate相当于一个异步的请求，类似于api.post
    mutate({
      // 这里调用了useLogin返回的mutation, 传入了一个json和param
      json: values,
    });
  };

  useEffect(() => {
    if (status === "pending") setIsLoading(true);
    else if (status !== "idle") {
      setIsLoading(false);
      if (!data?.success) {
        toast.error(data?.message);
      } else {
        toast.success(data?.message);
      }
    }
  }, [status, data]);

  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">Welcome back!</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button size={"lg"} className="w-full" disabled={isPending}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex flex-col gap-y-4">
        <Button variant={"secondary"} size={"lg"} disabled={isPending} className="w-full">
          <FcGoogle style={{ width: "1.3rem", height: "1.3rem" }} />
          Login with Google
        </Button>
        <Button variant={"secondary"} size={"lg"} disabled={isPending} className="w-full">
          <FaGithub style={{ width: "1.3rem", height: "1.3rem" }} />
          Login with Github
        </Button>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex items-center justify-center">
        <div className="text-center">
          Don&apos;t have an account?{" "}
          <Link href="/sign-in">
            <span className="text-[#60a5fa] underline underline-offset-auto">
              Sign up
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
