import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getJobPhotos, uploadJobPhoto } from "@/lib/pro/dashboard/jobs";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { photoTypeSchema } from "@/lib/validations/pro-dashboard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireProfessionalSession();
    const { id } = await context.params;
    // Ownership-scoped: never returns another cleaner's job photos.
    const photos = await getJobPhotos(id, profile.id);
    return jsonSuccess({ photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load photos.";
    return jsonError(message, message.includes("Authentication") ? 401 : 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireProfessionalSession();
    const { id } = await context.params;
    const formData = await request.formData();

    const photoTypeRaw = formData.get("photoType");
    const file = formData.get("file");

    const photoTypeParsed = photoTypeSchema.safeParse(photoTypeRaw);
    if (!photoTypeParsed.success) {
      return jsonError("Invalid photo type.", 400);
    }

    if (!(file instanceof File)) {
      return jsonError("A photo file is required.", 400);
    }

    if (!file.type.startsWith("image/")) {
      return jsonError("Only image files are allowed.", 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return jsonError("Photo must be under 10 MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const photo = await uploadJobPhoto(
      id,
      profile.id,
      photoTypeParsed.data,
      buffer,
      file.name,
      file.type,
    );

    return jsonSuccess({ photo }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload photo.";
    return jsonError(message, 400);
  }
}
