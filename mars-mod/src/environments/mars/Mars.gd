extends Spatial

func _ready() -> void:
	pass
	
	
func init_cam_pos() -> Basis:
	return $Camera.global_transform

