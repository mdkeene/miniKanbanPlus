import { supabase } from "@/lib/supabase";
import { type ConfigTablero } from "@/tipos/tareas";

export async function obtenerConfigTablero(): Promise<ConfigTablero> {
  const { data, error } = await supabase
    .from("configs")
    .select("value")
    .eq("id", "board_mode")
    .single();

  if (error || !data) {
    return { locked_in: false };
  }

  return data.value as ConfigTablero;
}

export async function actualizarConfigTablero(locked: boolean): Promise<void> {
  const { error } = await supabase
    .from("configs")
    .upsert({
      id: "board_mode",
      value: { locked_in: locked }
    });

  if (error) {
    console.error("Error updating board configuration:", error);
    throw error;
  }
}
